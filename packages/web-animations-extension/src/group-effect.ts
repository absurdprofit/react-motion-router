export abstract class GroupEffect implements AnimationEffect {
	#children: AnimationEffect[] = [];
	constructor(children: AnimationEffect[]) {
		this.#children = children;
		console.log(this);
	}

	get children() {
		const _children = this.#children;
		return {
			length: _children.length,
			item(index: number) {
				return _children.at(index) ?? null;
			}
		};
	}

	get firstChild() {
		return this.#children.at(0) ?? null;
	}

	get lastChild() {
		return this.#children.at(-1) ?? null;
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;

	clone() {
		return structuredClone(this);
	}

	append(...children: AnimationEffect[]): void {
		children.forEach(child => {
			if (!this.#children.includes(child))
				this.#children.push(child);
		});
	}

	prepend(...children: AnimationEffect[]): void {
		children.forEach(child => {
			if (!this.#children.includes(child))
				this.#children.unshift(child);
		});
	}
}

