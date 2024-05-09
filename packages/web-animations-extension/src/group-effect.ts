export abstract class GroupEffect implements AnimationEffect {
	protected readonly _children: AnimationEffect[];

	constructor(children: AnimationEffect[]) {
		this._children = children;
	}

	get children() {
		const _children = this._children;
		return {
			length: _children.length,
			item(index: number) {
				return _children.at(index) ?? null;
			}
		};
	}

	get firstChild() {
		return this._children.at(0);
	}

	get lastChild() {
		return this._children.at(-1);
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;

	clone() {
		return structuredClone(this);
	}

	append(...children: AnimationEffect[]): void {
		children.forEach(child => {
			if (!this._children.includes(child))
				this._children.push(child);
		});
	}

	prepend(...children: AnimationEffect[]): void {
		children.forEach(child => {
			if (!this._children.includes(child))
				this._children.unshift(child);
		});
	}
}

