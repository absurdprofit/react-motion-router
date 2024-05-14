import { GroupEffectDetails } from "./common/types";

const privateDetails = new WeakMap<GroupEffect, GroupEffectDetails>();

export abstract class GroupEffect implements AnimationEffect {
	constructor(children: AnimationEffect[]) {
		privateDetails.set(this, {
			children,
			parent: null
		});
	}

	get children() {
		const details = privateDetails.get(this);
		const _children = details?.children ?? [];
		return {
			length: _children.length,
			item(index: number) {
				return _children.at(index) ?? null;
			}
		};
	}

	get firstChild() {
		const details = privateDetails.get(this);
		return details?.children.at(0) ?? null;
	}

	get lastChild() {
		const details = privateDetails.get(this);
		return details?.children.at(-1) ?? null;
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;

	clone() {
		return structuredClone(this);
	}

	append(...children: AnimationEffect[]): void {
		const details = privateDetails.get(this);
		children.forEach(child => {
			if (details && !details.children.includes(child))
				details.children.push(child);
		});
	}

	prepend(...children: AnimationEffect[]): void {
		const details = privateDetails.get(this);
		children.forEach(child => {
			if (details && !details.children.includes(child))
				details.children.unshift(child);
		});
	}
}

