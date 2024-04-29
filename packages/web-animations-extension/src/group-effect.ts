export abstract class GroupEffect implements AnimationEffect {
	readonly children: AnimationEffect[];
	// TODO: ctor should take an optional timing
	// TODO: Constructing GroupEffect via base class should be forbidden.
	constructor(effects: AnimationEffect[]) {
		this.children = effects;
	}

	get effects(): AnimationEffect[] {
		return this.children.map(effect => {
			if (effect instanceof GroupEffect)
				return effect.effects;
			return effect;
		}).flat();
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;
}

