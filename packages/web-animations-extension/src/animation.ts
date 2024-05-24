import { associatedAnimation } from "./common/associated-animation";
import { RESOLVED_AUTO_DURATION } from "./common/constants";
import { NativeAnimation, NativeKeyframeEffect, isNull } from "./common/types";
import { cssNumberishToNumber, currentTimeFromPercent, currentTimeFromTime } from "./common/utils";
import { GestureTimeline, GestureTimelineUpdateEvent } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";
import { KeyframeEffect } from "./keyframe-effect";
import { PromiseWrapper } from "./promise-wrapper";

export class Animation extends EventTarget implements NativeAnimation {
	public id: string = '';

	public oncancel: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onfinish: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onremove: ((this: NativeAnimation, ev: Event) => any) | null = null;

	#timeline: AnimationTimeline | null;
	#effect: AnimationEffect | null;
	#replaceState: AnimationReplaceState = "active";
	#pending: {
		task: "play" | "pause" | null;
		playbackRate: number | null;
	} = {
		task: null,
		playbackRate: null
	};
	#readyPromise: PromiseWrapper<Animation> | null = null;
	#finishedPromise: PromiseWrapper<Animation> | null = null;
	#startTime: number | null = null;
	#holdTime: number | null = null;
	#children: (NativeAnimation | Animation)[] = [];
	#previousCurrentTime: CSSNumberish | null = null;
	#autoAlignStartTime: boolean = false;
	
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();

		this.#effect = effect ?? null;
		this.#timeline = timeline ?? document.timeline;

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
			this.#autoAlign();
			console.log(this.#pending.task, this.#startTime, this.#holdTime)
			if (this.#pending.task === 'play' && (this.#startTime !== null || this.#holdTime !== null)) {
				this.#commitPendingPlay();
			} else if (this.#pending.task === 'pause') {
				this.#commitPendingPause();
			}
		});
	}

	#commitPendingPlay()  {
		const timelineTime = this.timeline?.currentTime ?? null;
		if (timelineTime === null) {
			return
		}
		const timelineTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, this.effect?.getTiming()) : currentTimeFromTime(timelineTime);
		if (this.#holdTime != null) {
			this.#applyPendingPlaybackRate();
			if (this.playbackRate === 0) {
				this.#startTime = timelineTimeMs;
			} else {
				this.#startTime = timelineTimeMs - this.#holdTime / this.playbackRate;
				this.#holdTime = null;
			}
		} else if (this.#startTime !== null && this.#pending.playbackRate !== null) {
			const currentTimeToMatch = (timelineTimeMs - this.#startTime) * this.playbackRate;
			this.#applyPendingPlaybackRate();
			const playbackRate = this.playbackRate;
			if (playbackRate === 0) {
				this.#holdTime = null;
				this.#startTime = timelineTimeMs;
			} else {
				this.#startTime = timelineTimeMs - currentTimeToMatch / playbackRate;
			}
		}
	
		if (this.#readyPromise && this.#readyPromise.state === 'pending')
			 this.#readyPromise.resolve(this);
	
		this.#updateFinishedState(false);
	
		this.#syncCurrentTime();
		this.#pending.task = null;
		this.#children.forEach(child => child.play());
	}

	#commitPendingPause() {
		const timelineTime = this.timeline?.currentTime ?? null;
		if (timelineTime === null) {
			return
		}
		const readyTime = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, this.effect?.getTiming()) : currentTimeFromTime(timelineTime);
		if (this.#startTime != null && this.#holdTime === null) {
			this.#holdTime = (readyTime - this.#startTime) * this.playbackRate;
		}
	
		this.#applyPendingPlaybackRate();
		this.#startTime = null;
		this.#readyPromise?.resolve(this);
		this.#updateFinishedState(false);
		this.#syncCurrentTime();
		this.#pending.task = null;
		this.#children.forEach(child => child.pause());
	}

	#autoAlign() {
		if (!this.#autoAlignStartTime) {
			return;
		}
	
		if (!this.#timeline || !this.#timeline.currentTime) {
			return;
		}
	
		if (this.playState === 'idle' ||
			(this.playState === 'paused' && this.#holdTime !== null)) {
			return;
		}

		const playbackRate = this.#pending.playbackRate ?? this.playbackRate;
		this.#startTime = 0; // TODO: fix this
		this.#holdTime = null;
	}

	#syncCurrentTime() {
		const timelineTime = this.#timeline?.currentTime ?? null;
		if (timelineTime === null)
			return;
		const effect = this.#effect;
		const timelineTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, effect?.getTiming()) : currentTimeFromTime(timelineTime);
		let currentTime = null;
		if (this.#startTime !== null) {
			const startTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(this.#startTime, effect?.getTiming()) : currentTimeFromTime(this.#startTime);
			const atTimelineBoundary = cssNumberishToNumber(timelineTime, 'percent') === (this.playbackRate < 0 ? 0 : 100);
			const delta = atTimelineBoundary ? (this.playbackRate < 0 ? 0.001 : -0.001) : 0;
			currentTime = (timelineTimeMs - startTimeMs) * this.playbackRate;
			currentTime += delta;
		} else if (this.#holdTime !== null) {
			currentTime = this.#holdTime;
		} else {
			return;
		}
		this.#children.forEach(child => child.currentTime = currentTime);
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
			// TODO: we really should intercept ScrollTimeline and convert it to time values for child animations
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

	#updateFinishedState(didSeek: boolean) {
		const timelineTime = this.#timeline?.currentTime ?? null;
		let unconstrainedCurrentTime = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, this.#effect?.getTiming()) : currentTimeFromTime(timelineTime);
	
		if (unconstrainedCurrentTime && this.#startTime != null && !this.pending) {
			let { delay = 0, endDelay = 0, iterations = 1, duration = 'auto' } = this.#effect?.getTiming() ?? {};
			const playbackRate = this.#pending.playbackRate ?? this.playbackRate;
			if (duration === 'auto') {
				duration = this.#timeline instanceof GestureTimeline ? RESOLVED_AUTO_DURATION : 0;
			} else if (duration instanceof CSSNumericValue) {
				duration = duration.to('ms').value;
			} else if (typeof duration === "string") {
				throw new TypeError("Unknown effect duration keyword.");
			}

			const upperBound = delay + (duration * iterations) + endDelay;
			let boundary = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(this.#previousCurrentTime, this.#effect?.getTiming()) : currentTimeFromTime(this.#previousCurrentTime);
			if (playbackRate > 0 && unconstrainedCurrentTime >= upperBound && this.#previousCurrentTime != null) {
				if (boundary === null || boundary < upperBound)
					boundary = upperBound;
				this.#holdTime = didSeek ? unconstrainedCurrentTime : boundary;
			} else if (playbackRate < 0 && unconstrainedCurrentTime <= 0) {
				if (boundary === null || boundary > 0)
					boundary = 0;
				this.#holdTime = didSeek ? unconstrainedCurrentTime : boundary;
			} else if (playbackRate != 0) {
				if (didSeek && this.#holdTime !== null) {
					const timelineTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, this.#effect?.getTiming()) : currentTimeFromTime(timelineTime);
					this.#startTime = timelineTimeMs !== null ? timelineTimeMs - this.#holdTime / playbackRate : timelineTimeMs;
				}
				this.#holdTime = null;
			}
		}
	
		this.#syncCurrentTime();
		this.#previousCurrentTime = this.currentTime;
		const playState = this.playState;
	
		if (playState === 'finished') {
			if (!this.#finishedPromise)
				this.#finishedPromise = new PromiseWrapper();
			if (this.#finishedPromise.state === 'pending') {
				this.finish();
			}
		} else {
			if (this.#finishedPromise && this.#finishedPromise.state === 'resolved') {
				this.#finishedPromise = new PromiseWrapper();
			}
		}
	}

	#applyPendingPlaybackRate() {
		if (this.#pending.playbackRate)
			this.playbackRate = this.#pending.playbackRate;
		this.#pending.playbackRate = null;
	}

	#dispatchFinishedEvent(this: Animation) {
		if (this.#finishedPromise?.state !== 'pending')
			return;
		if (this.playState !== "finished") return;

		this.#finishedPromise.resolve(this);

		const getCurrentTime = () => this.currentTime;
		const getTimelineTime = () => this.timeline?.currentTime;
		const event = new AnimationPlaybackEvent(
			'finish',
			{
				get currentTime() {
					return getCurrentTime();
				},
				get timelineTime() {
					return getTimelineTime();
				}
			}
		);
		requestAnimationFrame(() => {
			this.dispatchEvent(event);
			this.onfinish?.call(this, event);
		});
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
		const abortedPause = this.playState === 'paused' && this.pending;

		let hasPendingReadyPromise = false;
		let previousCurrentTime = null;
		
		if (this.#timeline instanceof GestureTimeline) {
			previousCurrentTime = currentTimeFromPercent(this.#timeline.currentTime, this.effect?.getTiming());
		} else {
			previousCurrentTime = currentTimeFromTime(this.#timeline?.currentTime ?? null);
		}

		const playbackRate = this.#pending.playbackRate ?? this.playbackRate;
		if (playbackRate === 0 && previousCurrentTime === null) {
			this.#holdTime = 0;
		}

		if (previousCurrentTime == null) {
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
			this.#startTime !== null
			&& this.#holdTime === null
			&& !abortedPause
			&& this.#pending.playbackRate === null
		) {
			return;
		}

		if (this.#readyPromise && !hasPendingReadyPromise) {
			this.#readyPromise = null;
		}

		this.#syncCurrentTime();

		if (!this.#readyPromise) {
			this.#createReadyPromise();
		}
		this.#pending.task = 'play';

		this.#updateFinishedState(false);
	}

	pause() {
		console.trace();
		if (this.playState === "paused")
			return;

		if (this.currentTime === null) {
      this.#autoAlignStartTime = true;
    }

		if (this.#pending.task === 'play')
			this.#pending.task = null;
		else
			this.#readyPromise = null;

		if (!this.#readyPromise)
			this.#createReadyPromise();
		this.#pending.task ='pause';
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
		if (this.playState !== 'idle') {
			this.#pending.task = null;
		
			this.#applyPendingPlaybackRate();
			this.#readyPromise?.reject(new DOMException("The user aborted a request", "AbortError"));
		
			this.#createReadyPromise();
			this.#readyPromise?.resolve(this);

      if (this.#finishedPromise && this.#finishedPromise.state == 'pending') {
        this.#finishedPromise.reject(new DOMException("The user aborted a request", "AbortError"));
      }
      this.#finishedPromise = new PromiseWrapper();
			this.#children.forEach(animation => animation.cancel());
    }

    this.#startTime = null;
    this.#holdTime = null;
	}

	updatePlaybackRate(playbackRate: number): void {
		this.#pending.playbackRate = playbackRate;
		const previousPlayState = this.playState;

    if (this.#readyPromise && this.#readyPromise.state === 'pending')
      return;

    switch(previousPlayState) {
      case 'idle':
      case 'paused':
        this.#applyPendingPlaybackRate();
			break;

      case 'finished':
        const timelineTime = this.#timeline?.currentTime ?? null;;
        if (playbackRate === 0) {
          this.#startTime = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, this.effect?.getTiming()) : currentTimeFromTime(timelineTime);
        } else if (timelineTime !== null) {
					let unconstrainedCurrentTime = null;
					const timelineTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(timelineTime, this.effect?.getTiming()) : currentTimeFromTime(timelineTime);
					unconstrainedCurrentTime = (timelineTimeMs - (this.#startTime ?? 0)) * this.playbackRate
					if (this.#startTime !== null && unconstrainedCurrentTime !== null)
						this.#startTime = (timelineTimeMs - unconstrainedCurrentTime) / playbackRate;
        }
        this.#applyPendingPlaybackRate();
        this.#updateFinishedState(false);
        this.#syncCurrentTime();
        break;

      default:
        this.play();
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

	set playbackRate(desiredPlaybackRate: number) {
		this.#children.forEach(animation => {
			const { playbackRate: specifiedPlaybackRate = 1 } = animation.effect?.getTiming() ?? {};
			animation.playbackRate = specifiedPlaybackRate * desiredPlaybackRate;
		});
	}

	set startTime(_startTime: CSSNumberish | null) {
		this.#children.forEach(animation => animation.startTime = _startTime);
	}

	set currentTime(currentTime: CSSNumberish | null) {
		if (this.#timeline instanceof GestureTimeline) {
			const timelineTime = this.#timeline?.currentTime;
			if (isNull(currentTime) && !isNull(timelineTime)) {
				throw new TypeError("currentTime may not be changed from resolved to unresolved.");
			}

			currentTime = currentTimeFromPercent(currentTime, this.#effect?.getTiming());
			this.#autoAlignStartTime = false;
			if (
				this.#holdTime !== null
				|| this.#startTime === null
				|| this.#timeline.phase === 'inactive'
				|| this.playbackRate === 0
			) {
				this.#holdTime = currentTime;
			} else if (currentTime !== null) {
				this.#startTime = currentTimeFromPercent(currentTime, this.#effect?.getTiming()) - currentTime / this.playbackRate;
			}

			if (this.#timeline.phase === 'inactive') {
				this.#startTime = null;
			}

			this.#previousCurrentTime = null;
				
			if (this.#pending.task === 'pause') {
				this.#holdTime = currentTime;
				this.#applyPendingPlaybackRate();
				this.#startTime = null;
				this.#pending.task = null;
				this.#readyPromise?.resolve(this);
			}
			

    	this.#updateFinishedState(true);
		} else {
			this.#children.forEach(child => child.currentTime = currentTime);
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
		if (!this.#readyPromise) {
      this.#readyPromise = new PromiseWrapper();
      this.#readyPromise.resolve(this);
    }
    return this.#readyPromise.promise;
	}

	get finished(): Promise<Animation> {
		if (!this.#finishedPromise) {
      this.#finishedPromise = new PromiseWrapper();
    }
    return this.#finishedPromise.promise;
	}

	get playState() {
		let { playbackRate = 1, endTime = 0 } = this.effect?.getComputedTiming() ?? {};
		const startTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(this.startTime, this.#effect?.getTiming()) : currentTimeFromTime(this.startTime);
		const currentTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(this.currentTime, this.#effect?.getTiming()) : currentTimeFromTime(this.currentTime);
		const endTimeMs = this.#timeline instanceof GestureTimeline ? currentTimeFromPercent(endTime, this.#effect?.getTiming()) : currentTimeFromTime(endTime);
		if (currentTimeMs === null && startTimeMs === null && this.#pending.task === null)
			return 'idle';
		else if (this.#pending.task === 'pause' || (startTimeMs === null && this.#pending.task !== 'play'))
			return 'paused';
		else if (currentTimeMs !== null && ((playbackRate > 0 && currentTimeMs >= endTimeMs) || (playbackRate < 0 && currentTimeMs <= 0)))
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
		// TODO: convert to percent UnitValue in case of GestureTimeline
		return this.#startTime;
	}

	get timeline() {
		return this.#timeline;
	}

	get effect() {
		return this.#effect;
	}
}