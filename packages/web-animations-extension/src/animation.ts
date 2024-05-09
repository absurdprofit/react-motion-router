import { NativeAnimation } from "./common/types";
import { GroupEffect } from "./group-effect";

export class Animation extends EventTarget implements NativeAnimation {
	public id: string = '';
	public effect: AnimationEffect | null = null;
	public timeline: AnimationTimeline | null;
	private readonly children: NativeAnimation[] = [];
	public _playbackRate = 1;
	private _pending = false;
	private _playState: AnimationPlayState = "idle";
	private _startTime: CSSNumberish | null = null;
	private _currentTime: CSSNumberish | null = null;
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
		this.removed.then(this.dispatchRemovedEvent.bind(this));
	}

	reverse(): void {
		this.updatePlaybackRate(-this._playbackRate);
	}

	play() {
		this.children.forEach(animation => animation.play());
	}

	pause() {
		this.children.forEach(animation => animation.pause());
	}

	persist(): void {
		this.children.forEach(animation => animation.persist());
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
		this._playbackRate = _playbackRate;
	}

	set startTime(_startTime: CSSNumberish | null) {
		this._startTime = _startTime;
	}

	set currentTime(_currentTime: CSSNumberish | null) {
		this._currentTime = _currentTime;
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
		return this._playState;
	}

	get playbackRate() {
		return this._playbackRate;
	}

	get replaceState() {
		return this._replaceState;
	}

	get pending() {
		return this._pending;
	}

	get currentTime() {
		return this._currentTime;
	}

	get startTime() {
		return this._startTime;
	}
}