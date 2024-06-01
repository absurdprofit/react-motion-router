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

		if (this.#associatedAnimation?.timeline instanceof GestureTimeline) {
			if (timing?.duration === Infinity)
				throw TypeError("Effect duration cannot be Infinity for non-monotonic timelines.");

			if (timing?.iterations)
				throw TypeError("Effect iterations cannot be Infinity for non-monotonic timelines.");
		}

		return super.updateTiming(timing);
	}
}