import { NativeAnimation, AnimationDetails } from "./common/types";
import { currentTimeFromPercent } from "./common/utils";
import { GestureTimeline, GestureTimelineUpdateEvent } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";

const privateDetails = new WeakMap<Animation, AnimationDetails>();

function updateChildren(details: AnimationDetails, effect: AnimationEffect | null) {
	const { children } = details;
	// clear children
	children.splice(0, children.length);
	if (effect instanceof GroupEffect) {
		for (let i = 0; i < effect.children.length; i++) {
			children.push(new Animation(effect.children.item(i), details.timeline));
		}
	} else {
		const timeline = details.timeline instanceof GestureTimeline ? null : details.timeline;
		children.push(new NativeAnimation(effect, timeline));
	}
}

function onGestureTimelineUpdate(this: Animation, {currentTime}: GestureTimelineUpdateEvent) {
	const { startTime = 0, endTime = 0 } = this.effect?.getComputedTiming() ?? {};
	this.currentTime = currentTimeFromPercent(currentTime, startTime, endTime);
}

// TODO: properly handle updating playbackRate
// TODO: properly handle playback. We need to manage pending states properly.

export class Animation extends EventTarget implements NativeAnimation {
	public id: string = '';

	public oncancel: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onfinish: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onremove: ((this: NativeAnimation, ev: Event) => any) | null = null;
	
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();

		const details: AnimationDetails = {
			effect: effect ?? null,
			timeline: timeline ?? document.timeline,
			replaceState: "active",
			pendingTask: null,
			startTime: null,
			children: [],
			onGestureTimelineUpdate: onGestureTimelineUpdate.bind(this)
		};
		privateDetails.set(this, details);
		updateChildren(details, effect ?? null);

		if (timeline instanceof GestureTimeline) {
			timeline.addEventListener('update', details.onGestureTimelineUpdate);
		}

		this.finished.then(this.dispatchFinishedEvent.bind(this));
		this.cancelled.then(this.dispatchCancelledEvent.bind(this));
		this.removed.then(() => {
			this.dispatchRemovedEvent();
			if (details)
				details.replaceState = 'removed';
		});
	}

	reverse(): void {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.reverse());
	}

	play() {
		if (!(this.timeline instanceof DocumentTimeline)) return; // TODO: properly handle playback of gesture animation
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.play());
	}

	pause() {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.pause());
	}

	persist(): void {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.persist());
		if (details)
			details.replaceState = 'persisted';
	}

	finish(): void {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.finish());
	}

	commitStyles() {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => {
			if (animation.effect instanceof KeyframeEffect && animation.effect.pseudoElement === null) {
				animation.commitStyles();
			}
		});
	}

	cancel() {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.cancel());
	}

	updatePlaybackRate(playbackRate: number): void {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.updatePlaybackRate(playbackRate));
	}

	addEventListener<K extends keyof AnimationEventMap>(type: K, listener: (ev: AnimationEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		super.addEventListener(type, listener, options);
	}

	removeEventListener<K extends keyof AnimationEventMap>(type: K, listener: (ev: AnimationEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		super.removeEventListener(type, listener, options);
	}

	private dispatchFinishedEvent() {
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

	private dispatchCancelledEvent() {
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

	private dispatchRemovedEvent() {
		const event = new Event('remove');
		this.dispatchEvent(event);
		this.onremove?.call(this, event);
	}

	set playbackRate(_playbackRate: number) {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.playbackRate = _playbackRate);
	}

	set startTime(_startTime: CSSNumberish | null) {
		const details = privateDetails.get(this);
		details?.children.forEach(animation => animation.startTime = _startTime);
	}

	set currentTime(_currentTime: CSSNumberish | null) {
		const details = privateDetails.get(this);
		details?.children.forEach(child => {
			child.currentTime = _currentTime;
		});
	}

	set timeline(_timeline: AnimationTimeline | null) {
		const details = privateDetails.get(this);
		if (!details?.timeline)
			return;

		if (details.timeline instanceof GestureTimeline)
			details.timeline.removeEventListener('update', details.onGestureTimelineUpdate);
		details.timeline = _timeline ?? document.timeline;

		details.children.forEach(child => {
			if (child instanceof Animation) {
				child.timeline = _timeline;
			} else {
				child.timeline = _timeline instanceof GestureTimeline ? null : _timeline;
			}
		});
		if (_timeline instanceof GestureTimeline) {
			_timeline.addEventListener('update', details?.onGestureTimelineUpdate);
			details.children.forEach(child => child.pause());
		}
	}

	set effect(_effect: AnimationEffect | null) {
		const details = privateDetails.get(this);
		if (details) {
			details.effect = _effect;
			updateChildren(details, _effect);
		}
	}

	get ready(): Promise<Animation> {
		const details = privateDetails.get(this);
		if (!details) return Promise.resolve(this);
		return Promise.all(details.children.map(animation => animation.ready)).then(() => this);
	}

	get finished(): Promise<Animation> {
		const details = privateDetails.get(this);
		if (!details) return Promise.resolve(this);
		return Promise.all(details.children.map(animation => animation.finished)).then(() => this);
	}

	private get cancelled(): Promise<Animation> {
		const details = privateDetails.get(this);
		if (!details) return Promise.resolve(this);
		return Promise.all(details.children.map(animation => new Promise(resolve => animation.oncancel = resolve))).then(() => this);
	}

	private get removed(): Promise<Animation> {
		const details = privateDetails.get(this);
		if (!details) return Promise.resolve(this);
		return Promise.all(details.children.map(animation => new Promise(resolve => animation.onremove = resolve))).then(() => this);
	}

	get playState() {
		const details = privateDetails.get(this);
		const { playbackRate = 0, endTime = 0 } = this.effect?.getComputedTiming() ?? {};
		const end = endTime instanceof CSSNumericValue ? endTime.to('ms').value : endTime;
		const startTime = this.startTime;
		let currentTime = this.currentTime;
		currentTime = currentTime instanceof CSSNumericValue ? currentTime.to('ms').value : currentTime;
		if (currentTime === null && startTime === null && details?.pendingTask === null)
			return 'idle';
		else if (details?.pendingTask === 'pause' || (startTime === null && details?.pendingTask !== 'play'))
			return 'paused';
		else if (currentTime !== null && ((playbackRate > 0 && currentTime >= end) || (playbackRate < 0 && currentTime <= 0)))
			return 'finished';
		return 'running';
	}

	get playbackRate() {
		return this.effect?.getComputedTiming().playbackRate ?? 1;
	}

	get replaceState() {
		return privateDetails.get(this)?.replaceState ?? 'removed';
	}

	get pending(): boolean {
		return privateDetails.get(this)?.pendingTask !== null;
	}

	get currentTime() {
		return this.effect?.getComputedTiming().localTime ?? null;
	}

	get startTime() {
		return this.effect?.getComputedTiming().startTime ?? null;
	}

	get timeline(): AnimationTimeline {
		return privateDetails.get(this)?.timeline ?? document.timeline;
	}

	get effect() {
		return privateDetails.get(this)?.effect ?? null;
	}
}