import { NativeKeyframeEffect } from "./common/types";
import { KeyframeEffect } from "./keyframe-effect";

export abstract class GroupEffect implements AnimationEffect {
	#children: AnimationEffect[] = [];
	#parent: GroupEffect | null = null;
	constructor(children: AnimationEffect[]) {
		this.#children = children.map(child => {
			if (child instanceof GroupEffect)
				child.#parent = this;
			else if (child instanceof NativeKeyframeEffect)
				child = new KeyframeEffect(child, this);
			return child;
		});
	}

	get parent() {
		return this.#parent;
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
			if (!this.#children.includes(child)) {
				if (child instanceof GroupEffect) {
					child.#parent = this;
				} else if (child instanceof NativeKeyframeEffect) {
					child = new KeyframeEffect(child, this);
				}
				this.#children.push(child);
			}
		});
	}

	prepend(...children: AnimationEffect[]): void {
		children.forEach(child => {
			if (!this.#children.includes(child)) {
				if (child instanceof GroupEffect) {
					child.#parent = this;
				} else if (child instanceof NativeKeyframeEffect) {
					child = new KeyframeEffect(child, this);
				}
				this.#children.unshift(child);
			}
		});
	}
}

