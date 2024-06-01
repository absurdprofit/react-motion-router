import { associatedAnimation } from "./common/associated-animation";
import { DEFAULT_TIMING } from "./common/constants";
import { computedTimingToPercent, cssNumberishToNumber } from "./common/utils";
import { GestureTimeline } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";

export class ParallelEffect extends GroupEffect {
	#timing: OptionalEffectTiming;
	constructor(children: AnimationEffect[], timing: OptionalEffectTiming = DEFAULT_TIMING) {
		super(children);
		this.#timing = {
			...DEFAULT_TIMING,
			...timing
		};

		children.forEach(effect => effect.updateTiming());
	}

	prepend(...children: AnimationEffect[]): void {
		super.prepend(...children);
		children.forEach(effect => effect.updateTiming());
	}

	append(...children: AnimationEffect[]): void {
		super.append(...children);
		children.forEach(effect => effect.updateTiming());
	}

	getTiming(): EffectTiming {
		return this.#timing;
	}

	getComputedTiming(): ComputedEffectTiming {
		const timing = this.getTiming();
		const computedTiming: ComputedEffectTiming = {...timing};
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children.item(i);
			if (!child) continue;
			let {
				delay = 0,
				endDelay = 0,
				playbackRate = 1,
				duration = 'auto',
				localTime,
				activeDuration = 0,
				currentIteration,
				endTime = 0,
				startTime = 0
			} = child.getComputedTiming();
			timing.delay = timing.delay ? Math.min(timing.delay, delay) : delay;
			timing.endDelay = timing.endDelay ? Math.max(timing.endDelay, endDelay) : endDelay;
			// TODO: calculate iteration index https://drafts.csswg.org/web-animations-1/#calculating-the-current-iteration
			// timing.iterations = timing.iterations ? Math.max(timing.iterations, iterations) : iterations;
			timing.playbackRate = timing.playbackRate ? Math.max(playbackRate, timing.playbackRate) : playbackRate;
			computedTiming.endTime = computedTiming.endTime ? Math.max(cssNumberishToNumber(computedTiming.endTime, 'ms'), cssNumberishToNumber(endTime, 'ms')) : endTime;
			computedTiming.startTime = computedTiming.startTime ? Math.min(cssNumberishToNumber(computedTiming.startTime, 'ms'), cssNumberishToNumber(startTime, 'ms')) : startTime;
			computedTiming.currentIteration = computedTiming.currentIteration ? Math.max(computedTiming.currentIteration, currentIteration!) : currentIteration;
			computedTiming.activeDuration = computedTiming.activeDuration ? Math.max(cssNumberishToNumber(computedTiming.activeDuration, 'ms'), cssNumberishToNumber(activeDuration, 'ms')) : activeDuration;
			computedTiming.localTime = computedTiming.localTime ? Math.max(cssNumberishToNumber(computedTiming.localTime, 'ms'), cssNumberishToNumber(localTime!, 'ms')) : localTime;
			if (localTime && activeDuration)
				computedTiming.progress = cssNumberishToNumber(localTime, 'ms') / cssNumberishToNumber(activeDuration, 'ms');
			timing.duration = timing.duration instanceof CSSNumericValue ? timing.duration.to('ms').value : timing.duration;
			duration = duration instanceof CSSNumericValue ? duration.to('ms').value : duration;
			if (typeof duration !== 'string')
				if (timing.duration === 'auto')
					timing.duration = cssNumberishToNumber(duration, 'ms');
				else if (typeof timing.duration !== 'string')
					timing.duration = timing.duration ? Math.max(timing.duration, duration) : duration;
		}

		const associatedTimeline = associatedAnimation.get(this)?.timeline;
		if (associatedTimeline instanceof GestureTimeline) {
			return computedTimingToPercent(computedTiming, associatedTimeline);
		}
		return computedTiming;
	}

	updateTiming(timing?: OptionalEffectTiming) {
		this.#timing = {
			...this.#timing,
			...timing
		};
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children.item(i)
			child?.updateTiming();
		}
	}
}