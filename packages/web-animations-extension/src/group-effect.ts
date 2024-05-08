export abstract class GroupEffect implements AnimationEffect {
	readonly children: AnimationEffect[];
	constructor(children: AnimationEffect[]) {
		this.children = children;
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;
}

