import { cssNumberishToNumber } from "./common/utils";
import { GroupEffect } from "./group-effect";

export class ParallelEffect extends GroupEffect {
	constructor(effects: AnimationEffect[]) {
		super(effects);
		if (effects.length == 0)
			return;
	}

	getTiming(): EffectTiming {
		const timing: EffectTiming = {};
		for (let i = 0; i < this.children.length; ++i) {
			let {delay, endDelay, duration, iterationStart, iterations, easing, fill, direction, playbackRate} = this.children[i].getTiming();
			timing.delay = delay && timing.delay ? Math.min(cssNumberishToNumber(timing.delay, 'ms'), cssNumberishToNumber(delay, 'ms')) : timing.delay;
			timing.endDelay = endDelay && timing.endDelay ? Math.max(cssNumberishToNumber(timing.endDelay, 'ms'), cssNumberishToNumber(endDelay, 'ms')) : timing.endDelay;
			timing.iterationStart = iterationStart && timing.iterationStart ? Math.max(timing.iterationStart, iterationStart) : timing.iterationStart;
			timing.iterations = iterations && timing.iterations ? Math.max(timing.iterations, iterations) : timing.iterations;
			timing.easing = easing || timing.easing;
			timing.fill = fill || timing.fill;
			timing.direction = direction || timing.direction;
			timing.playbackRate = playbackRate || timing.playbackRate;
			if (typeof duration !== "string" && typeof timing.duration !== "string") {
				timing.duration = duration && timing.duration ? Math.max(cssNumberishToNumber(timing.duration, 'ms'), cssNumberishToNumber(duration, 'ms')) : timing.duration;
			} else {
				timing.duration = duration;
			}
		}
		return timing;
	
	}

	getComputedTiming(): ComputedEffectTiming {
		const timing: ComputedEffectTiming = {...this.getTiming()};
		for (let i = 0; i < this.children.length; ++i) {
			let {startTime, endTime, progress, currentIteration, activeDuration, localTime} = this.children[i].getComputedTiming();
			timing.endTime = endTime && timing.endTime ? Math.max(cssNumberishToNumber(timing.endTime, 'ms'), cssNumberishToNumber(endTime, 'ms')) : timing.endTime;
			timing.startTime = startTime && timing.startTime ? Math.min(cssNumberishToNumber(timing.startTime, 'ms'), cssNumberishToNumber(startTime, 'ms')) : timing.startTime;
			timing.progress = progress && timing.progress ? Math.min(timing.progress, progress) : timing.progress;
			timing.currentIteration = currentIteration && timing.currentIteration ? Math.max(timing.currentIteration, currentIteration) : timing.currentIteration;
			timing.activeDuration = activeDuration && timing.activeDuration ? Math.max(cssNumberishToNumber(timing.activeDuration, 'ms'), cssNumberishToNumber(activeDuration, 'ms')) : timing.activeDuration;
			timing.localTime = localTime && timing.localTime ? Math.max(cssNumberishToNumber(timing.localTime, 'ms'), cssNumberishToNumber(localTime, 'ms')) : timing.localTime;
		}
		return timing;
	}

	updateTiming(timing?: OptionalEffectTiming) {
		for (let i = 0; i < this.children.length; ++i) {
			this.children[i].updateTiming(timing);
		}
	}
}