import { DEFAULT_TIMING } from "./common/constants";
import { cssNumberishToNumber } from "./common/utils";
import { GroupEffect } from "./group-effect";

export class ParallelEffect extends GroupEffect {
	#timing: OptionalEffectTiming;
	constructor(effects: AnimationEffect[], timing: OptionalEffectTiming = DEFAULT_TIMING) {
		super(effects);
		this.#timing = {
			...DEFAULT_TIMING,
			...timing
		};

		this.updateTiming();
	}

	prepend(...children: AnimationEffect[]): void {
		super.prepend(...children);
		this.updateTiming();
	}

	append(...children: AnimationEffect[]): void {
		super.append(...children);
		this.updateTiming();
	}

	getTiming(): EffectTiming {
		const timing: EffectTiming = this.#timing;
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children.item(i);
			if (!child) continue;
			let {delay = 0, endDelay = 0, duration = 'auto', iterationStart = 0, iterations = 1, playbackRate = 0} = child.getTiming();
			timing.delay = timing.delay ? Math.min(timing.delay, delay) : delay;
			timing.endDelay = timing.endDelay ? Math.max(timing.endDelay, endDelay) : endDelay;
			timing.iterationStart = timing.iterationStart ? Math.max(timing.iterationStart, iterationStart) : iterationStart;
			timing.iterations = timing.iterations ? Math.max(timing.iterations, iterations) : iterations;
			timing.playbackRate = timing.playbackRate ? Math.max(playbackRate, timing.playbackRate) : playbackRate;
			timing.duration = timing.duration instanceof CSSNumericValue ? timing.duration.to('ms').value : timing.duration;
			duration = duration instanceof CSSNumericValue ? duration.to('ms').value : duration;
			if (typeof duration !== 'string')
				if (timing.duration === 'auto')
					timing.duration = cssNumberishToNumber(duration, 'ms');
				else if (typeof timing.duration !== 'string')
					timing.duration = timing.duration ? Math.max(timing.duration, duration) : duration;
		}
	
		return timing;
	}

	getComputedTiming(): ComputedEffectTiming {
		const timing = this.getTiming();
		const computedTiming: ComputedEffectTiming = {...timing};
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children.item(i);
			if (!child) continue;
			const {startTime = 0, endTime = 0, currentIteration = 1, activeDuration = 0, localTime = 0} = child.getComputedTiming();
			computedTiming.endTime = computedTiming.endTime ? Math.max(cssNumberishToNumber(computedTiming.endTime, 'ms'), cssNumberishToNumber(endTime, 'ms')) : endTime;
			computedTiming.startTime = computedTiming.startTime ? Math.min(cssNumberishToNumber(computedTiming.startTime, 'ms'), cssNumberishToNumber(startTime, 'ms')) : startTime;
			computedTiming.currentIteration = computedTiming.currentIteration ? Math.max(computedTiming.currentIteration, currentIteration!) : currentIteration;
			computedTiming.activeDuration = computedTiming.activeDuration ? Math.max(cssNumberishToNumber(computedTiming.activeDuration, 'ms'), cssNumberishToNumber(activeDuration, 'ms')) : activeDuration;
			computedTiming.localTime = computedTiming.localTime ? Math.max(cssNumberishToNumber(computedTiming.localTime, 'ms'), cssNumberishToNumber(localTime!, 'ms')) : localTime;
		}

		const { activeDuration, localTime } = computedTiming;
		if (localTime && activeDuration)
			computedTiming.progress = cssNumberishToNumber(localTime, 'ms') / cssNumberishToNumber(activeDuration, 'ms');
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