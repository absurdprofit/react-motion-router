import { NativeAnimation } from "./common/types";
import { currentTimeFromPercent } from "./common/utils";
import { GestureTimeline, GestureTimelineUpdateEvent } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";
import { KeyframeEffect } from "./keyframe-effect";

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
	#startTime: CSSNumberish | null;
	#holdTime: CSSNumberish | null;
	#children: (NativeAnimation | Animation)[];
	
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();

		this.#effect = effect ?? null,
		this.#timeline = timeline ?? document.timeline,
		this.#replaceState = "active",
		this.#pending = {
			playbackRate: null,
			task: null
		},
		this.#startTime = null;
		this.#holdTime = null;
		this.#children = [];
		this.#updateChildren();

		if (timeline instanceof GestureTimeline) {
			timeline.addEventListener('update', this.#onGestureTimelineUpdate);
		}
	}

	#onGestureTimelineUpdate = ({currentTime}: GestureTimelineUpdateEvent) => {
		const { startTime = 0, endTime = 0 } = this.#effect?.getComputedTiming() ?? {};
		this.currentTime = currentTimeFromPercent(currentTime, startTime, endTime);
	}

	#updateChildren(this: Animation) {
		const effect = this.#effect;
		const children = [];
		if (effect instanceof GroupEffect) {
			for (let i = 0; i < effect.children.length; i++) {
				children.push(new Animation(effect.children.item(i)));
			}
		} else {
			children.push(new NativeAnimation(effect));
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

		}
	}

	pause() {
		if (this.#timeline instanceof DocumentTimeline) {
			this.#children.forEach(animation => animation.pause());
		} else {

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
		this.#children.forEach(animation => animation.updatePlaybackRate(playbackRate));
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
		this.#children.forEach(child => {
			child.currentTime = _currentTime;
		});
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

	set effect(_effect: AnimationEffect | null) {
		this.#effect = _effect;
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
		if (this.#effect instanceof KeyframeEffect)
			return new KeyframeEffect(this.#effect, null, this.#timeline);
		return this.#effect;
	}
}