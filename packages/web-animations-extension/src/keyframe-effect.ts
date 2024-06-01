import { associatedAnimation } from "./common/associated-animation";
import { NativeKeyframeEffect } from "./common/types";
import { computedTimingToPercent, cssNumberishToNumber } from "./common/utils";
import { GestureTimeline } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";

export class KeyframeEffect extends NativeKeyframeEffect {
	#parent: GroupEffect | null = null;
	constructor(effect: NativeKeyframeEffect, parent: GroupEffect | null = null) {
		super(effect);
		this.#parent = parent;
	}

	get parent() {
		return this.#parent;
	}

	getTiming(): EffectTiming {
		const timing = super.getTiming();
		if (associatedAnimation.get(this)?.timeline instanceof GestureTimeline) {
			if (timing.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");
			if (timing.iterations === Infinity)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
		}
		return timing;
	}

	getComputedTiming(): ComputedEffectTiming {
		const computedTiming = super.getComputedTiming();
		const associatedTimeline = associatedAnimation.get(this)?.timeline;
		if (associatedTimeline instanceof GestureTimeline) {
			if (computedTiming.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");
			if (computedTiming.iterations === Infinity)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
			
			return computedTimingToPercent(computedTiming, associatedTimeline);
		}
		return computedTiming;
	}

	updateTiming(timing?: OptionalEffectTiming) {
		const specifiedTiming = super.getTiming();
		timing = {
			...specifiedTiming,
			duration: specifiedTiming.duration instanceof CSSNumericValue ? specifiedTiming.duration.to('ms').value : specifiedTiming.duration,
			...timing
		};

		let ancestor = this.#parent;
		while (ancestor) {
			const ancestorTiming = ancestor.getTiming();
			if (timing?.delay)
				timing.delay += ancestorTiming.delay ?? 0;
			if (timing?.endDelay)
				timing.endDelay += ancestorTiming.endDelay ?? 0;
			if (timing?.iterationStart)
				timing.iterationStart += ancestorTiming.iterationStart ?? 0;
			if (timing?.iterations)
				timing.iterations *= ancestorTiming.iterations ?? 1;
			if (timing?.playbackRate)
				timing.playbackRate *= ancestorTiming.playbackRate ?? 1;
			if (ancestorTiming.duration) {
				if (typeof ancestorTiming.duration !== 'string')
					if (timing?.duration === 'auto')
						timing.duration = cssNumberishToNumber(ancestorTiming.duration, 'ms');
			}

			ancestor = ancestor.parent;
		}

		if (associatedAnimation.get(this)?.timeline instanceof GestureTimeline) {
			if (timing?.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");

			if (timing?.iterations)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
		}

		return super.updateTiming(timing);
	}
}