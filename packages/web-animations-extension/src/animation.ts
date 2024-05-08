export class Animation extends EventTarget implements globalThis.Animation {
	readonly animations: Animation[] = [];
	private _playState: AnimationPlayState = "idle";
	public effect: AnimationEffect | null = null;
	public timeline: AnimationTimeline | null;
	public _playbackRate = 1;
	public id: string = '';
	private _replaceState: AnimationReplaceState = 'active';
	private _pending = false;
	private _currentTime: CSSNumberish | null = null;
	private _startTime: CSSNumberish | null = null;
	oncancel: ((this: globalThis.Animation, ev: AnimationPlaybackEvent) => any) | null = null;
	onfinish: ((this: globalThis.Animation, ev: AnimationPlaybackEvent) => any) | null = null;
	onremove: ((this: globalThis.Animation, ev: Event) => any) | null = null;
	
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super();
		this.effect = effect ?? null;
		this.timeline = timeline ?? null;
		// this.animations = effect?.effects.map(effect => new Animation(effect, timeline)) ?? new Array();
	}

	reverse(): void {
		this.updatePlaybackRate(-this._playbackRate);
	}

	play() {
		this.animations.map(animation => animation.play());
	}

	pause() {
		this.animations.map(animation => animation.pause());
	}

	persist(): void {
			
	}

	finish(): void {
			
	}

	commitStyles() {
		this.animations.map(animation => animation.commitStyles());
	}

	cancel() {
		this.animations.map(animation => animation.cancel());
	}

	updatePlaybackRate(playbackRate: number): void {
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
		return Promise.all(this.animations.map(animation => animation.ready)).then(() => this);
	}

	get finished(): Promise<Animation> {
		return Promise.all(this.animations.map(animation => animation.finished)).then(() => this);
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