import { associatedAnimation } from "./common/associated-animation";
import { NativeKeyframeEffect } from "./common/types";
import { computedTimingToPercent, cssNumberishToNumber } from "./common/utils";
import { GestureTimeline } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";

export class KeyframeEffect extends NativeKeyframeEffect {
	#nativeEffect: NativeKeyframeEffect;
	#parent: GroupEffect | null = null;
	constructor(effect: NativeKeyframeEffect, parent: GroupEffect | null = null) {
		super(effect);
		this.#nativeEffect = effect;
		this.#parent = parent;
	}

	get parent() {
		return this.#parent;
	}

	get #associatedAnimation() {
		return associatedAnimation.get(this) ?? null;
	}

	getTiming(): EffectTiming {
		const timing = this.#nativeEffect.getTiming();
		if (this.#associatedAnimation?.timeline instanceof GestureTimeline) {
			if (timing.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");
			if (timing.iterations === Infinity)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
		}
		return timing;
	}

	getComputedTiming(): ComputedEffectTiming {
		const computedTiming = this.#nativeEffect.getComputedTiming();
		if (this.#associatedAnimation?.timeline instanceof GestureTimeline) {
			if (computedTiming.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");
			if (computedTiming.iterations === Infinity)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
			
			return computedTimingToPercent(computedTiming, this.#associatedAnimation.timeline);
		}
		return computedTiming;
	}

	updateTiming(timing?: OptionalEffectTiming) {
		const nativeTiming = this.#nativeEffect.getTiming();
		timing = {
			...nativeTiming,
			duration: nativeTiming.duration instanceof CSSNumericValue ? nativeTiming.duration.to('ms').value : nativeTiming.duration,
			...timing
		};

		let parent = this.#parent;
		while (parent) {
			const parentTiming = parent.getTiming();
			if (timing?.delay)
				timing.delay += parentTiming.delay ?? 0;
			if (timing?.endDelay)
				timing.endDelay += parentTiming.endDelay ?? 0;
			if (timing?.iterationStart)
				timing.iterationStart += parentTiming.iterationStart ?? 0;
			if (timing?.iterations)
				timing.iterations *= parentTiming.iterations ?? 1;
			if (timing?.playbackRate)
				timing.playbackRate *= parentTiming.playbackRate ?? 1;
			if (parentTiming.duration) {
				if (typeof parentTiming.duration !== 'string')
					if (timing?.duration === 'auto')
						timing.duration = cssNumberishToNumber(parentTiming.duration, 'ms');
			}

			parent = parent.parent;
		}

		if (this.#associatedAnimation?.timeline instanceof GestureTimeline) {
			if (timing?.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");

			if (timing?.iterations)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
		}

		return super.updateTiming(timing);
	}
}