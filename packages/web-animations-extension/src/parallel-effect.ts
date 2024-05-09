import { cssNumberishToNumber } from "./common/utils";
import { GroupEffect } from "./group-effect";

export class ParallelEffect extends GroupEffect {
	private readonly timing;
	constructor(effects: AnimationEffect[], timing: OptionalEffectTiming = {}) {
		super(effects);
		this.timing = timing;
		this.updateTiming(timing);
	}

	prepend(...children: AnimationEffect[]): void {
		super.prepend(...children);
		children.forEach(child => child.updateTiming(this.timing));
	}

	append(...children: AnimationEffect[]): void {
		super.append(...children);
		children.forEach(child => child.updateTiming(this.timing));
	}

	getTiming(): EffectTiming {
		const timing: EffectTiming = this.timing;
		this._children.forEach(child => {
			let {delay = 0, endDelay = 0, duration = 'auto', iterationStart = 0, iterations = 1, playbackRate = 0} = child.getTiming();
			timing.delay = timing.delay ? Math.min(timing.delay, delay) : delay;
			timing.endDelay = timing.endDelay ? Math.max(timing.endDelay, endDelay) : endDelay;
			timing.iterationStart = timing.iterationStart ? Math.max(timing.iterationStart, iterationStart) : iterationStart;
			timing.iterations = timing.iterations ? Math.max(timing.iterations, iterations) : iterations;
			timing.playbackRate = timing.playbackRate ? Math.max(playbackRate, timing.playbackRate) : playbackRate;
			timing.duration = timing.duration instanceof CSSNumericValue ? timing.duration.to('ms').value : timing.duration;
			duration = duration instanceof CSSNumericValue ? duration.to('ms').value : duration;
			if (typeof timing.duration === "string")
				timing.duration = duration;
			else if (typeof duration !== "string")
				timing.duration = timing.duration ? Math.max(timing.duration, duration) : duration;
		})
		return timing;
	}

	getComputedTiming(): ComputedEffectTiming {
		const timing = this.getTiming();
		const computedTiming: ComputedEffectTiming = {...timing};
		this._children.forEach(child => {
			const {startTime = 0, endTime = 0, progress = 0, currentIteration = 1, activeDuration = 0, localTime = 0} = child.getComputedTiming();
			computedTiming.endTime = computedTiming.endTime ? Math.max(cssNumberishToNumber(computedTiming.endTime, 'ms'), cssNumberishToNumber(endTime, 'ms')) : endTime;
			computedTiming.startTime = computedTiming.startTime ? Math.min(cssNumberishToNumber(computedTiming.startTime, 'ms'), cssNumberishToNumber(startTime, 'ms')) : startTime;
			computedTiming.progress = computedTiming.progress ? Math.min(computedTiming.progress, progress!) : progress;
			computedTiming.currentIteration = computedTiming.currentIteration ? Math.max(computedTiming.currentIteration, currentIteration!) : currentIteration;
			computedTiming.activeDuration = computedTiming.activeDuration ? Math.max(cssNumberishToNumber(computedTiming.activeDuration, 'ms'), cssNumberishToNumber(activeDuration, 'ms')) : activeDuration;
			computedTiming.localTime = computedTiming.localTime ? Math.max(cssNumberishToNumber(computedTiming.localTime, 'ms'), cssNumberishToNumber(localTime!, 'ms')) : localTime;
		});
		return computedTiming;
	}

	updateTiming(timing?: OptionalEffectTiming) {
		this._children.forEach(child => child.updateTiming(timing));
	}
}