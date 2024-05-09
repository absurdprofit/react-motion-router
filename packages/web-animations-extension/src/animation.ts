import { NativeAnimation } from "./common/types";
import { GroupEffect } from "./group-effect";

export class Animation extends EventTarget implements NativeAnimation {
	public id: string = '';
	public effect: AnimationEffect | null = null;
	public timeline: AnimationTimeline | null;
	private readonly children: NativeAnimation[] = [];
	private _replaceState: AnimationReplaceState = 'active';

	public oncancel: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onfinish: ((this: NativeAnimation, ev: AnimationPlaybackEvent) => any) | null = null;
	public onremove: ((this: NativeAnimation, ev: Event) => any) | null = null;
	
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();
		this.effect = effect ?? null;
		this.timeline = timeline ?? null;
		if (effect instanceof GroupEffect) {
			for (let i = 0; i < effect.children.length; i++) {
				this.children.push(new Animation(effect.children.item(i), timeline));
			}
		} else {
			this.children = [new NativeAnimation(effect, timeline)];
		}

		this.finished.then(this.dispatchFinishedEvent.bind(this));
		this.cancelled.then(this.dispatchCancelledEvent.bind(this));
		this.removed.then(() => {
			this.dispatchRemovedEvent();
			this._replaceState = 'removed';
		});
	}

	reverse(): void {
		this.updatePlaybackRate(-this.playbackRate);
	}

	play() {
		this.children.forEach(animation => animation.play());
	}

	pause() {
		this.children.forEach(animation => animation.pause());
	}

	persist(): void {
		this.children.forEach(animation => animation.persist());
		this._replaceState = 'persisted';
	}

	finish(): void {
		this.children.forEach(animation => animation.finish());
	}

	commitStyles() {
		this.children.forEach(animation => animation.commitStyles());
	}

	cancel() {
		this.children.forEach(animation => animation.cancel());
	}

	updatePlaybackRate(playbackRate: number): void {
		this.children.forEach(animation => animation.updatePlaybackRate(playbackRate));
	}

	addEventListener<K extends keyof AnimationEventMap>(type: K, listener: (this: Animation, ev: AnimationEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		super.addEventListener(type, listener, options);
	}

	removeEventListener<K extends keyof AnimationEventMap>(type: K, listener: (this: Animation, ev: AnimationEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
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
		this.children.forEach(animation => animation.playbackRate = _playbackRate);
	}

	set startTime(_startTime: CSSNumberish | null) {
		this.children.forEach(animation => animation.startTime = _startTime);
	}

	set currentTime(_currentTime: CSSNumberish | null) {
		// TODO: figure out how to set the current time of a group effect
		this.children.forEach(animation => animation.currentTime = _currentTime);
	}

	get ready(): Promise<Animation> {
		return Promise.all(this.children.map(animation => animation.ready)).then(() => this);
	}

	get finished(): Promise<Animation> {
		return Promise.all(this.children.map(animation => animation.finished)).then(() => this);
	}

	private get cancelled(): Promise<Animation> {
		return Promise.all(this.children.map(animation => new Promise(resolve => animation.oncancel = resolve))).then(() => this);
	}

	private get removed(): Promise<Animation> {
		return Promise.all(this.children.map(animation => new Promise(resolve => animation.onremove = resolve))).then(() => this);
	}

	get playState() {
		const { playbackRate = 0, endTime = 0 } = this.effect?.getComputedTiming() ?? {};
		const end = endTime instanceof CSSNumericValue ? endTime.to('ms').value : endTime;
		const startTime = this.startTime
		let currentTime = this.currentTime;
		currentTime = currentTime instanceof CSSNumericValue ? currentTime.to('ms').value : currentTime;
		if (currentTime === null && startTime === null)
			return 'idle';
		else if (this.children.every(child => child.playState === 'paused') || (startTime === null && this.pending))
			return 'paused';
		else if (currentTime !== null && ((playbackRate > 0 && currentTime >= end) || (playbackRate < 0 && currentTime <= 0)))
			return 'finished';
		return 'running';
	}

	get playbackRate() {
		return this.effect?.getComputedTiming().playbackRate ?? 1;
	}

	get replaceState() {
		return this._replaceState;
	}

	get pending() {
		return this.children.some(animation => animation.pending);
	}

	get currentTime() {
		return this.effect?.getComputedTiming().localTime ?? null;
	}

	get startTime() {
		return this.effect?.getComputedTiming().startTime ?? null;
	}
}