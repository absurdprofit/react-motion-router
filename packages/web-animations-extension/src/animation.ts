import { associatedAnimation } from "./common/associated-animation";
import { MAX_DURATION_PERCENTAGE, MIN_DURATION_PERCENTAGE, RESOLVED_AUTO_DURATION } from "./common/constants";
import { NativeAnimation, isNull } from "./common/types";
import { cssNumberishToNumber, msFromPercent, msFromTime } from "./common/utils";
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
	#readyPromise: PromiseWrapper<Animation> = new PromiseWrapper();
	#finishedPromise: PromiseWrapper<Animation> = new PromiseWrapper();
	#startTime: number | null = null;
	#holdTime: number | null = null;
	#children: (NativeAnimation | Animation)[] = [];
	#previousCurrentTime: CSSNumberish | null = null;
	#autoAlignStartTime: boolean = false;
	#pendingTaskRequestId = 0;
	#playbackRate: number = 1;

	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();

		this.#readyPromise.resolve(this);
		this.#effect = effect ?? null;
		this.#timeline = timeline ?? document.timeline;

		if (this.#effect)
			associatedAnimation.set(this.#effect, this);

		this.#updateChildren();

		if (timeline instanceof GestureTimeline) {
			timeline.addEventListener('update', this.#onGestureTimelineUpdate);
		}
	}

	#setCurrentTimeSilently(seekTime: CSSNumberish | null) {
		const timelineTime = this.#timeline?.currentTime ?? null;
		if (seekTime === null) {
			if (timelineTime !== null) {
				throw new TypeError();
			}
		}

		if (seekTime === null || timelineTime === null)
			return;

		if (this.#timeline instanceof GestureTimeline)
			seekTime = msFromPercent(seekTime, this.#effect?.getTiming());
		else
			seekTime = msFromTime(seekTime);

		this.#autoAlignStartTime = false;

		if (
			this.#holdTime !== null
			|| this.#startTime === null
			|| (this.#timeline instanceof GestureTimeline && this.#timeline.phase === 'inactive')
			|| this.#playbackRate === 0
		) {
			this.#holdTime = seekTime;
		} else {
			let timelineTimeMs;
			if (this.#timeline instanceof GestureTimeline)
				timelineTimeMs = msFromPercent(timelineTime, this.#effect?.getTiming());
			else
				timelineTimeMs = msFromTime(timelineTime);
			this.#startTime = timelineTimeMs - seekTime / this.#playbackRate;
		}

		if (this.#timeline instanceof GestureTimeline && this.#timeline.phase === 'inactive') {
			this.#startTime = null;
		}

		this.#previousCurrentTime = null
	}

	#schedulePendingTask() {
		if (this.#readyPromise.state !== "pending")
			this.#readyPromise = new PromiseWrapper();

		cancelAnimationFrame(this.#pendingTaskRequestId);
		this.#pendingTaskRequestId = requestAnimationFrame(() => {
			const timelineTime = this.#timeline?.currentTime ?? null;
			if (timelineTime === null) {
				return
			}
			this.#autoAlign();
			if (this.#pending.task === 'play' && (this.#startTime !== null || this.#holdTime !== null)) {
				this.#commitPendingPlay();
			} else if (this.#pending.task === 'pause') {
				this.#commitPendingPause();
			}
		});
	}

	#commitPendingPlay() {
		const timelineTime = this.timeline?.currentTime ?? null;
		if (timelineTime === null) {
			return
		}

		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		if (this.#holdTime !== null) {
			this.#applyPendingPlaybackRate();
			if (this.playbackRate === 0) {
				this.#startTime = cssNumberishToNumber(timelineTime, unit);
			} else {
				this.#startTime = cssNumberishToNumber(timelineTime, unit) - this.#holdTime / this.playbackRate;
				this.#holdTime = null;
			}
		} else if (this.#startTime !== null && this.#pending.playbackRate !== null) {
			const currentTimeToMatch = (cssNumberishToNumber(timelineTime, unit) - this.#startTime) * this.playbackRate;
			this.#applyPendingPlaybackRate();
			const playbackRate = this.playbackRate;
			if (playbackRate === 0) {
				this.#holdTime = null;
				this.#startTime = cssNumberishToNumber(timelineTime, unit);
			} else {
				this.#startTime = cssNumberishToNumber(timelineTime, unit) - currentTimeToMatch / playbackRate;
			}
		}

		if (this.#readyPromise.state === 'pending')
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

		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		const readyTime = timelineTime;
		if (this.#startTime !== null && this.#holdTime === null) {
			this.#holdTime = (cssNumberishToNumber(readyTime, unit) - this.#startTime) * this.playbackRate;
		}

		this.#applyPendingPlaybackRate();
		this.#startTime = null;
		this.#readyPromise.resolve(this);
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

		if (this.playState === 'idle' || (this.playState === 'paused' && this.#holdTime !== null)) {
			return;
		}

		if (this.#timeline instanceof GestureTimeline) {
			const playbackRate = this.#pending.playbackRate ?? this.playbackRate;
			this.#startTime = playbackRate >= 0 ? MIN_DURATION_PERCENTAGE : MAX_DURATION_PERCENTAGE;
		} else {
			this.#startTime = cssNumberishToNumber(this.#timeline.currentTime, 'ms');
		}
		this.#holdTime = null;
	}

	#syncCurrentTime() {
		const timelineTime = this.#timeline?.currentTime ?? null;
		if (timelineTime === null)
			return;
		const effect = this.#effect;
		const timelineTimeMs = this.#timeline instanceof GestureTimeline ? msFromPercent(timelineTime, effect?.getTiming()) : msFromTime(timelineTime);
		let currentTime = null;
		if (this.#startTime !== null) {
			const startTimeMs = this.#timeline instanceof GestureTimeline ? msFromPercent(this.#startTime, effect?.getTiming()) : msFromTime(this.#startTime);
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

	#onGestureTimelineUpdate = ({ currentTime }: GestureTimelineUpdateEvent) => {
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

		Promise.all(children.map(child => child.finished)).then(this.#dispatchFinishedEvent);
		Promise.all(children.map(child => new Promise(resolve => child.onremove = resolve))).then(this.#dispatchRemovedEvent);
		Promise.all(children.map(child => new Promise(resolve => child.oncancel = resolve)))
			.then(this.#dispatchCancelledEvent)
			.then(() => this.#replaceState = 'removed');
	}

	#updateFinishedState(didSeek: boolean) {
		const timelineTime = this.#timeline?.currentTime ?? null;
		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		let unconstrainedCurrentTime = cssNumberishToNumber(timelineTime, unit);

		if (unconstrainedCurrentTime && this.#startTime !== null && !this.pending) {
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
			let boundary = cssNumberishToNumber(this.#previousCurrentTime, unit);
			if (playbackRate > 0 && unconstrainedCurrentTime >= upperBound && this.#previousCurrentTime !== null) {
				if (boundary === null || boundary < upperBound)
					boundary = upperBound;
				this.#holdTime = didSeek ? unconstrainedCurrentTime : boundary;
			} else if (playbackRate < 0 && unconstrainedCurrentTime <= 0) {
				if (boundary === null || boundary > 0)
					boundary = 0;
				this.#holdTime = didSeek ? unconstrainedCurrentTime : boundary;
			} else if (playbackRate !== 0) {
				if (didSeek && this.#holdTime !== null) {
					if (timelineTime !== null) {
						this.#startTime = cssNumberishToNumber(timelineTime, unit) - this.#holdTime / playbackRate;
					} else {
						this.#startTime = null;
					}
				}
				this.#holdTime = null;
			}
		}

		this.#syncCurrentTime();
		this.#previousCurrentTime = this.currentTime;
		const playState = this.playState;

		if (playState === 'finished') {
			if (this.#finishedPromise.state === 'pending') {
				this.#dispatchFinishedEvent();
			}
		} else {
			if (this.#finishedPromise.state === 'resolved') {
				this.#finishedPromise = new PromiseWrapper();
			}
		}
	}

	#applyPendingPlaybackRate() {
		if (this.#pending.playbackRate)
			this.playbackRate = this.#pending.playbackRate;
		this.#pending.playbackRate = null;
	}

	#dispatchFinishedEvent = () => {
		if (this.#finishedPromise.state !== 'pending')
			return;
		if (this.playState !== "finished")
			return;

		this.#finishedPromise.resolve(this);

		const currentTime = this.currentTime;
		const timelineTime = this.timeline?.currentTime;
		const event = new AnimationPlaybackEvent(
			'finish',
			{
				get currentTime() {
					return currentTime;
				},
				get timelineTime() {
					return timelineTime;
				}
			}
		);
		requestAnimationFrame(() => {
			this.dispatchEvent(event);
			this.onfinish?.call(this, event);
		});
	}

	#dispatchCancelledEvent = () => {
		const currentTime = this.currentTime;
		const timelineTime = this.timeline?.currentTime;
		const event = new AnimationPlaybackEvent(
			'cancel',
			{
				get currentTime() {
					return currentTime;
				},
				get timelineTime() {
					return timelineTime;
				}
			}
		);
		this.dispatchEvent(event);
		this.oncancel?.call(this, event);
	}

	#dispatchRemovedEvent = () => {
		const event = new Event('remove');
		this.dispatchEvent(event);
		this.onremove?.call(this, event);
	}

	reverse(): void {
		this.#children.forEach(animation => animation.reverse());
	}

	play() {
		const abortedPause = this.playState === 'paused' && this.pending;

		let previousCurrentTime = this.currentTime;

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
		}

		if (
			this.#startTime !== null
			&& this.#holdTime === null
			&& !abortedPause
			&& this.#pending.playbackRate === null
		) {
			return;
		}

		this.#syncCurrentTime();

		this.#schedulePendingTask();
		this.#pending.task = 'play';

		this.#updateFinishedState(false);
	}

	pause() {
		if (this.playState === "paused")
			return;

		if (this.currentTime === null) {
			this.#autoAlignStartTime = true;
		}

		if (this.#pending.task)
			this.#pending.task = null;

		this.#schedulePendingTask();
		this.#pending.task = 'pause';
	}

	persist(): void {
		this.#children.forEach(animation => animation.persist());
		this.#replaceState = 'persisted';
	}

	finish(): void {
		const { endTime = 0 } = this.effect?.getComputedTiming() ?? {};
		const playbackRate = this.#pending.playbackRate ?? this.#playbackRate;
		if (playbackRate === 0 || (playbackRate > 0 && endTime === Infinity)) {
			throw new DOMException("InvalidStateError");
		}

		this.#applyPendingPlaybackRate();

		let limit;
		if (playbackRate > 0) {
			limit = endTime;
		} else {
			limit = 0;
		}

		this.#setCurrentTimeSilently(limit);

		if (
			this.startTime === null
			&& this.#timeline !== null
			&& this.#timeline.currentTime !== null
			&& limit !== null
		) {
			const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
			limit = cssNumberishToNumber(limit, unit);
			const timelineTime = cssNumberishToNumber(this.#timeline.currentTime, unit);
			this.#startTime = (timelineTime - (limit / playbackRate));
		}

		if (this.#pending.task === 'pause' && this.#startTime !== null) {
			this.#holdTime = null;
			this.#pending.task = null;
			cancelAnimationFrame(this.#pendingTaskRequestId);
			this.#readyPromise.resolve(this);
		}


		if (this.#pending.task === 'play' && this.#startTime !== null) {
			this.#pending.task = null;
			cancelAnimationFrame(this.#pendingTaskRequestId);
			this.#readyPromise.resolve(this);
		}

		this.#updateFinishedState(true);
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
			this.#readyPromise.reject(new DOMException("The user aborted a request", "AbortError"));

			this.#schedulePendingTask();
			this.#readyPromise.resolve(this);

			if (this.#finishedPromise.state === 'pending') {
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

		if (this.#readyPromise.state === 'pending')
			return;

		switch (previousPlayState) {
			case 'idle':
			case 'paused':
				this.#applyPendingPlaybackRate();
				break;

			case 'finished': {
				const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
				const timelineTime = this.#timeline?.currentTime ?? null;;
				if (playbackRate === 0) {
					this.#startTime = cssNumberishToNumber(timelineTime, unit);
				} else if (timelineTime !== null) {
					let unconstrainedCurrentTime = null;
					unconstrainedCurrentTime = (cssNumberishToNumber(timelineTime, unit) - (this.#startTime ?? 0)) * this.playbackRate
					if (this.#startTime !== null && unconstrainedCurrentTime !== null)
						this.#startTime = (cssNumberishToNumber(timelineTime, unit) - unconstrainedCurrentTime) / playbackRate; ''
				}
				this.#applyPendingPlaybackRate();
				this.#updateFinishedState(false);
				this.#syncCurrentTime();
				break;
			}

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

	set playbackRate(_playbackRate: number) {
		this.#playbackRate = _playbackRate;
		this.#children.forEach(animation => {
			animation.playbackRate *= _playbackRate;
		});
	}

	set startTime(_startTime: CSSNumberish | null) {
		this.#children.forEach(animation => animation.startTime = _startTime);
	}

	set currentTime(seekTime: CSSNumberish | null) {
		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		const timelineTime = cssNumberishToNumber(this.#timeline?.currentTime ?? null, unit);
		if (isNull(seekTime) && !isNull(timelineTime)) {
			throw new TypeError("currentTime may not be changed from resolved to unresolved.");
		}

		seekTime = cssNumberishToNumber(seekTime, unit);
		this.#autoAlignStartTime = false;
		if (
			this.#holdTime !== null
			|| this.#startTime === null
			|| timelineTime === null
			|| this.playbackRate === 0
		) {
			this.#holdTime = seekTime;
		} else {
			// since timelineTime is not null seekTime must not be null
			this.#startTime = timelineTime - (seekTime! / this.playbackRate);
		}

		if (this.#timeline === null || timelineTime === null) {
			this.#startTime = null;
		}

		this.#previousCurrentTime = null;

		this.#setCurrentTimeSilently(seekTime);
		if (this.#pending.task === 'pause') {
			this.#holdTime = seekTime;
			this.#applyPendingPlaybackRate();
			this.#startTime = null;
			this.#pending.task = null;
			cancelAnimationFrame(this.#pendingTaskRequestId);
			this.#readyPromise.resolve(this);
		}


		this.#updateFinishedState(true);
		this.#children.forEach(child => child.currentTime = seekTime);
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
		if (effect === this.#effect) return;
		if (this.pending) {
			this.#schedulePendingTask();
		}

		if (this.#effect)
			associatedAnimation.delete(this.#effect);
		if (effect) {
			const effectAssociatedAnimation = associatedAnimation.get(effect);
			if (effectAssociatedAnimation)
				effectAssociatedAnimation.effect = null;
			associatedAnimation.set(effect, this);
		}

		this.#effect = effect;
		this.#updateChildren();
		this.#updateFinishedState(false);
	}

	get ready(): Promise<Animation> {
		return this.#readyPromise.promise;
	}

	get finished(): Promise<Animation> {
		return this.#finishedPromise.promise;
	}

	get playState() {
		let { playbackRate = 1, endTime = 0 } = this.effect?.getComputedTiming() ?? {};
		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		const startTime = cssNumberishToNumber(this.startTime, unit);
		const currentTime = cssNumberishToNumber(this.currentTime, unit);
		endTime = cssNumberishToNumber(endTime, unit);
		if (currentTime === null && startTime === null && this.#pending.task === null)
			return 'idle';
		else if (this.#pending.task === 'pause' || (startTime === null && this.#pending.task !== 'play'))
			return 'paused';
		else if (currentTime !== null && ((playbackRate > 0 && currentTime >= endTime) || (playbackRate < 0 && currentTime <= 0)))
			return 'finished';
		return 'running';
	}

	get playbackRate() {
		return this.#playbackRate;
	}

	get replaceState() {
		return this.#replaceState;
	}

	get pending(): boolean {
		return Boolean(this.#readyPromise.state === 'pending');
	}

	get currentTime() {
		if (this.#holdTime)
			return this.#holdTime;

		const timelineTime = this.timeline?.currentTime ?? null;
		if (timelineTime === null) {
			return null;
		}
		if (this.#startTime === null)
			return null;

		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		let currentTime = (cssNumberishToNumber(timelineTime, unit) - this.#startTime) * this.playbackRate;

		if (currentTime === -0)
			currentTime = 0;

		if (typeof timelineTime === "number")
			return currentTime;
		return new CSSUnitValue(currentTime, unit);
	}

	get startTime() {
		if (this.#startTime === null)
			return null;

		const timelineTime = this.timeline?.currentTime ?? null;
		if (typeof timelineTime === "number")
			return this.#startTime;
		const unit = this.#timeline instanceof GestureTimeline ? 'percent' : 'ms';
		return new CSSUnitValue(this.#startTime, unit);
	}

	get timeline() {
		return this.#timeline;
	}

	get effect() {
		return this.#effect;
	}
}