import { GroupEffect } from "./group-effect";

export class GroupAnimation extends Animation {
	readonly animations: Animation[] = [];
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		super(effect instanceof GroupEffect ? null : effect, timeline);
		if (effect instanceof GroupEffect) {
			this.animations = effect.effects.map(effect => new Animation(effect, timeline));
		}
	}

	play() {
		this.animations.map(animation => animation.play());
	}

	pause() {
		this.animations.map(animation => animation.pause());
	}

	commitStyles() {
		this.animations.map(animation => animation.commitStyles());
	}

	get ready() {
		return Promise.all(this.animations.map(animation => animation.ready)).then(() => this);
	}

	get finished() {
		return Promise.all(this.animations.map(animation => animation.finished)).then(() => this);
	}
}