export abstract class GroupEffect implements AnimationEffect {
	private readonly _children: AnimationEffect[];

	constructor(children: AnimationEffect[]) {
		this._children = children;
	}

	get children() {
		return [...this._children];
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;

	appendChild(child: AnimationEffect): void {
		if (!this._children.includes(child))
			this._children.push(child);
	}

	removeChild(child: AnimationEffect): void {
		const index = this._children.indexOf(child);
		if (index >= 0)
			this._children.splice(index, 1);
	}
}

