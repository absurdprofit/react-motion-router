import { GroupEffect } from "./group-effect";

export class Animation extends window.Animation {

	playGroupEffect(groupEffect: GroupEffect) {
		for (let i = 0; i< groupEffect.children.length; ++i) {
			let effect = groupEffect.children[i];
			if (effect instanceof GroupEffect) {
				this.playGroupEffect(effect);
			} else if (effect instanceof KeyframeEffect) { 
				effect.target?.animate(effect.getKeyframes(), {...effect.getComputedTiming()});
			}
		}
	}

	play() {
		if (this.effect instanceof GroupEffect)
			this.playGroupEffect(this.effect);
		else if (this.effect instanceof KeyframeEffect)
			this.effect.target?.animate(this.effect.getKeyframes(), {...this.effect.getComputedTiming()});
	}
}