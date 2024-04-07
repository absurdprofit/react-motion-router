import { GroupEffect } from "./group-effect";

export class Animation extends window.Animation {
	readonly animations: globalThis.Animation[] = [];
	constructor(effect?: AnimationEffect | null, timeline?: AnimationTimeline | null) {
		let animations;
		if (effect instanceof GroupEffect) {
			animations = effect.effects.map(effect => new window.Animation(effect, timeline));
			effect = null;
		}
		super(effect, timeline);
		this.animations = animations || [];
	}

	play() {
		if (this.effect instanceof GroupEffect) {
			this.animations.map(animation => animation.play());
		} else if (this.effect instanceof KeyframeEffect)
			return super.play();
	}

	pause() {
		if (this.effect instanceof GroupEffect) {
			this.animations.map(animation => animation.pause());
		} else if (this.effect instanceof KeyframeEffect)
			return super.pause();
	}
}