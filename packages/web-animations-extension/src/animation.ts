import { associatedAnimation } from "./common/associated-animation";
import { NativeAnimation, NativeKeyframeEffect } from "./common/types";
import { cssNumberishToNumber, currentTimeFromPercent, currentTimeFromTime } from "./common/utils";
import { GestureTimeline, GestureTimelineUpdateEvent } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";
import { KeyframeEffect } from "./keyframe-effect";
import { PromiseWrapper } from "./promise-wrapper";

// TODO: properly handle updating playbackRate
// TODO: properly handle playback. We need to manage pending states properly.

export class Animation extends EventTarget implements NativeAnimation {
	public id: string = '';

	public oncancel: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onfinish: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onremove: ((this: NativeAnimation, ev: Event) => any) | null = null;

	#timeline: AnimationTimeline | null;
	#effect: AnimationEffect | null;
	#replaceState: AnimationReplaceState;
	#pending: {
		task: "play" | "pause" | null;
		playbackRate: number | null;
	};
	#readyPromise: PromiseWrapper<Animation> | null = null;
	#startTime: number | null;
	#holdTime: number | null;
	#autoAlignStartTime: boolean = true;
	#children: (NativeAnimation | Animation)[];
	
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();

		this.#effect = effect ?? null;
		this.#timeline = timeline ?? document.timeline;
		this.#replaceState = "active";
		this.#pending = {
			playbackRate: null,
			task: null
		};
		this.#startTime = null;
		this.#holdTime = null;
		this.#children = [];

		if (effect instanceof NativeKeyframeEffect)
			this.#effect = new KeyframeEffect(effect);

		if (this.#effect)
			associatedAnimation.set(this.#effect, this);

		this.#updateChildren();

		if (timeline instanceof GestureTimeline) {
			timeline.addEventListener('update', this.#onGestureTimelineUpdate);
		}
	}

	#createReadyPromise() {
		this.#readyPromise = new PromiseWrapper();
		requestAnimationFrame(() => {
			const timelineTime = this.#timeline?.currentTime ?? null;
			if (timelineTime === null) {
				return
			}
			// autoAlignStartTime(details);
			if (this.#pending.task === 'play' && (this.#startTime !== null || this.#holdTime !== null)) {
				this.#commitPendingPlay();
			} else if (this.#pending.task === 'pause') {
				this.#commitPendingPause();
			}
		});
	}

	#commitPendingPlay()  {
		const timelineTime = currentTimeFromPercent(this.#timeline?.currentTime, this.effect?.getTiming());
		if (this.#holdTime != null) {
			this.playbackRate = this.#pending.playbackRate ?? 1;
			this.#pending.playbackRate = null;
			if (this.playbackRate == 0) {
				this.#startTime = timelineTime;
			} else {
				this.#startTime = timelineTime - this.#holdTime / this.playbackRate;
				this.#holdTime = null;
			}
		} else if (this.#startTime !== null && this.#pending.playbackRate !== null) {
			const currentTimeToMatch = (timelineTime - this.#startTime) * this.playbackRate;
			this.playbackRate = this.#pending.playbackRate ?? 1;
			this.#pending.playbackRate = null;
			const playbackRate = this.playbackRate;
			if (playbackRate == 0) {
				this.#holdTime = null;
				this.#startTime = timelineTime;
			} else {
				this.#startTime = timelineTime - currentTimeToMatch / playbackRate;
			}
		}
	
		if (this.#readyPromise && this.#readyPromise.state == 'pending')
			 this.#readyPromise.resolve(this);
	
		// updateFinishedState(details, false, false);
	
		this.currentTime = this.#timeline?.currentTime ?? null;
		this.#pending.task = null;
	}

	#commitPendingPause() {
		const readyTime = currentTimeFromPercent(this.#timeline?.currentTime, this.effect?.getTiming());
		if (this.#startTime != null && this.#holdTime == null) {
			this.#holdTime = (readyTime - this.#startTime) * this.playbackRate;
		}
	
		this.playbackRate = this.#pending.playbackRate ?? 1;
		this.#pending.playbackRate = null;
		this.#startTime = null;
		this.#readyPromise?.resolve(this);
		// updateFinishedState(details, false, false);
		this.currentTime = this.#timeline?.currentTime ?? null;
		this.#pending.task = null;
	}

	#onGestureTimelineUpdate = ({currentTime}: GestureTimelineUpdateEvent) => {
		this.currentTime = currentTime;
	}

	#updateChildren(this: Animation) {
		let effect = this.#effect;
		const children = [];
		if (effect instanceof GroupEffect) {
			for (let i = 0; i < effect.children.length; i++) {
				children.push(new Animation(effect.children.item(i)));
			}
		} else {
			const timeline = this.#timeline instanceof GestureTimeline ? document.timeline : this.#timeline;
			children.push(new NativeAnimation(effect, timeline));
		}
	
		this.#children = children;
	
		Promise.all(children.map(child => child.finished)).then(this.#dispatchFinishedEvent.bind(this));
		Promise.all(children.map(child => new Promise(resolve => child.onremove = resolve))).then(this.#dispatchRemovedEvent.bind(this));
		Promise.all(children.map(child => new Promise(resolve => child.oncancel = resolve)))
			.then(this.#dispatchCancelledEvent.bind(this))
			.then(() => this.#replaceState = 'removed');
	}

	#dispatchFinishedEvent(this: Animation) {
		const event = new AnimationPlaybackEvent(
			'finish',
			{
				currentTime: this.currentTime,
				timelineTime: this.timeline?.currentTime
			}
		);
		this.dispatchEvent(event);
		this.onfinish?.call(this, event);
	}
	
	#dispatchCancelledEvent(this: Animation) {
		const event = new AnimationPlaybackEvent(
			'cancel',
			{
				currentTime: this.currentTime,
				timelineTime: this.timeline?.currentTime
			}
		);
		this.dispatchEvent(event);
		this.oncancel?.call(this, event);
	}
	
	#dispatchRemovedEvent(this: Animation) {
		const event = new Event('remove');
		this.dispatchEvent(event);
		this.onremove?.call(this, event);
	}

	reverse(): void {
		this.#children.forEach(animation => animation.reverse());
	}

	play() {
		if (this.#timeline instanceof DocumentTimeline) {
			this.#children.forEach(animation => animation.play());
		} else {
			const abortedPause = this.playState === 'paused' && this.pending;

			let hasPendingReadyPromise = false;
			let previousCurrentTime = null;
			
			if (this.#timeline instanceof GestureTimeline) {
				previousCurrentTime = currentTimeFromPercent(this.#timeline.currentTime, this.effect?.getTiming());
			} else {
				previousCurrentTime = currentTimeFromTime(this.#timeline?.currentTime);
			}

			const playbackRate = this.#pending.playbackRate ?? this.playbackRate;
			if (playbackRate === 0 && previousCurrentTime === null) {
				this.#holdTime = 0;
			}

			if (previousCurrentTime === null) {
				this.#autoAlignStartTime = true;
			}

			if (this.playState === 'finished' || abortedPause) {
				this.#startTime = null;
				this.#holdTime = null;
				this.#autoAlignStartTime = true;
			}

			if (this.#holdTime) {
				this.#startTime = null;
			}

			if (this.#pending.task) {
				this.#pending.task = null;
				hasPendingReadyPromise = true;
			}

			if (
				this.#holdTime === null
				&& !this.#autoAlignStartTime
				&& !abortedPause
				&& this.#pending.playbackRate === null
			) {
				return;
			}

			if (this.#readyPromise && !hasPendingReadyPromise) {
				this.#readyPromise = null;
			}

			this.currentTime = this.#timeline?.currentTime ?? null;

			if (!this.#readyPromise) {
				this.#createReadyPromise();
			}
			this.#pending.task = 'play';

			// updateFinishedState();
		}
	}

	pause() {
		if (this.#timeline instanceof DocumentTimeline) {
			this.#children.forEach(animation => animation.pause());
		} else {
			if (this.playState == "paused")
				return;
			if (this.currentTime === null) {
				this.#autoAlignStartTime = true;
			}
	
			if (this.#pending.task == 'play')
				this.#pending.task = null;
			else
				this.#readyPromise = null;
	
			if (!this.#readyPromise)
				this.#createReadyPromise();
			this.#pending.task ='pause';
		}
	}

	persist(): void {
		this.#children.forEach(animation => animation.persist());
		this.#replaceState = 'persisted';
	}

	finish(): void {
		this.#children.forEach(animation => animation.finish());
	}

	commitStyles() {
		this.#children.forEach(animation => {
			if (animation.effect instanceof KeyframeEffect && animation.effect.pseudoElement === null) {
				animation.commitStyles();
			}
		});
	}

	cancel() {
		this.#children.forEach(animation => animation.cancel());
	}

	updatePlaybackRate(playbackRate: number): void {
		if (this.#timeline instanceof GestureTimeline) {
			this.#pending.playbackRate = playbackRate;
			const previousPlayState = this.playState;

    if (this.#readyPromise && this.#readyPromise.state == 'pending')
      return;

    switch(previousPlayState) {
      case 'idle':
      case 'paused':
        this.playbackRate = this.#pending.playbackRate ?? 1;
				this.#pending.playbackRate = null;
			break;

      case 'finished':
        const timelineTime = currentTimeFromPercent(this.#timeline.currentTime, this.effect?.getTiming());
        let unconstrainedCurrentTime = null;
				if (timelineTime !== null) {
					unconstrainedCurrentTime = (timelineTime - (this.#startTime ?? 0)) * this.playbackRate
				}
        if (playbackRate == 0) {
          this.#startTime = timelineTime;
        } else {
					if (this.#startTime !== null && unconstrainedCurrentTime !== null)
						this.#startTime = (timelineTime - unconstrainedCurrentTime) / playbackRate;
        }
        this.playbackRate = this.#pending.playbackRate ?? 1;
				this.#pending.playbackRate = null;
        // updateFinishedState(details, false, false);
        this.currentTime = this.#timeline.currentTime ?? null;
        break;

      default:
        this.play();
    }
		} else {
			this.#children.forEach(animation => animation.updatePlaybackRate(animation.playbackRate * playbackRate));
		}
	}

	addEventListener<K extends keyof AnimationEventMap>(type: K, listener: (ev: AnimationEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		super.addEventListener(type, listener, options);
	}

	removeEventListener<K extends keyof AnimationEventMap>(type: K, listener: (ev: AnimationEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		super.removeEventListener(type, listener, options);
	}

	set playbackRate(_playbackRate: number) {
		this.#children.forEach(animation => animation.playbackRate = _playbackRate);
	}

	set startTime(_startTime: CSSNumberish | null) {
		this.#children.forEach(animation => animation.startTime = _startTime);
	}

	set currentTime(_currentTime: CSSNumberish | null) {
		if (this.#timeline instanceof GestureTimeline) {
			const timelineTimeMs = currentTimeFromPercent(_currentTime, this.effect?.getTiming());
			// silentlySetTheCurrentTime();
			if (this.#pending.task === 'pause') {
				this.#holdTime = timelineTimeMs;
				this.playbackRate = this.#pending.playbackRate ?? 1;
				this.#pending.playbackRate = null;
				this.#startTime = null;
				this.#pending.task = null;
				this.#readyPromise?.resolve(this);
			}
			this.#children.forEach(child => {
				if (!child.effect) return;
				if (this.#startTime !== null) {
					const timelineTime = this.#timeline?.currentTime;
					if (timelineTime === null)
						return;

					const atTimelineBoundary = timelineTime && cssNumberishToNumber(timelineTime, 'percent') == (this.playbackRate < 0 ? 0 : 100);
					const delta = atTimelineBoundary ? (this.playbackRate < 0 ? 0.001 : -0.001) : 0;
					_currentTime = (timelineTimeMs - this.#startTime) * this.playbackRate;
					_currentTime += delta;
				} else if (this.#holdTime !== null) {
					_currentTime = this.#holdTime;
				}
				child.currentTime = _currentTime !== null ? cssNumberishToNumber(_currentTime, 'ms') : null;
			});

    	// updateFinishedState(details, true, false);
		} else {
			this.#children.forEach(child => child.currentTime = _currentTime);
		}
	}

	set timeline(_timeline: AnimationTimeline | null) {
		if (this.#timeline instanceof GestureTimeline)
			this.#timeline.removeEventListener('update', this.#onGestureTimelineUpdate);

		this.#timeline = _timeline ?? document.timeline;

		if (_timeline instanceof GestureTimeline) {
			_timeline.addEventListener('update', this.#onGestureTimelineUpdate);
			this.#children.forEach(child => child.pause());
		}
	}

	set effect(effect: AnimationEffect | null) {
		if (effect instanceof NativeKeyframeEffect)
			effect = new KeyframeEffect(effect, null);
		if (this.#effect)
			associatedAnimation.delete(this.#effect);
		this.#effect = effect;
		if (effect)
			associatedAnimation.set(effect, this);
		this.#updateChildren();
	}

	get ready(): Promise<Animation> {
		return Promise.all(this.#children.map(animation => animation.ready)).then(() => this);
	}

	get finished(): Promise<Animation> {
		return Promise.all(this.#children.map(animation => animation.finished)).then(() => this);
	}

	get playState() {
		const { playbackRate = 0, endTime = 0 } = this.effect?.getComputedTiming() ?? {};
		const end = endTime instanceof CSSNumericValue ? endTime.to('ms').value : endTime;
		const startTime = this.startTime;
		let currentTime = this.currentTime;
		currentTime = currentTime instanceof CSSNumericValue ? currentTime.to('ms').value : currentTime;
		if (currentTime === null && startTime === null && this.#pending.task === null)
			return 'idle';
		else if (this.#pending.task === 'pause' || (startTime === null && this.#pending.task !== 'play'))
			return 'paused';
		else if (currentTime !== null && ((playbackRate > 0 && currentTime >= end) || (playbackRate < 0 && currentTime <= 0)))
			return 'finished';
		return 'running';
	}

	get playbackRate() {
		return Math.max(...this.#children.map(animation => animation.playbackRate));
	}

	get replaceState() {
		return this.#replaceState;
	}

	get pending(): boolean {
		return this.#pending.task !== null;
	}

	get currentTime() {
		return this.effect?.getComputedTiming().localTime ?? null;
	}

	get startTime() {
		return this.effect?.getComputedTiming().startTime ?? null;
	}

	get timeline() {
		return this.#timeline;
	}

	get effect() {
		return this.#effect;
	}
}