import { EasingFunction } from "./types";
import { cssNumberishToNumber } from "./utils";

export interface StaggerOptions {
	delay: number; // time gap between two KeyframeEffects
	emanation: number; // index of emanative KeyframeEffect
	easing: EasingFunction; // function that distributes the start time of each KeyframeEffect
	grid: number[];
};

export abstract class GroupEffect implements AnimationEffect {
	readonly children: AnimationEffect[];
	// TODO: ctor should take an optional timing
	// TODO: Constructing GroupEffect via base class should be forbidden.
	constructor(effects: AnimationEffect[]) {
		this.children = effects;
	}

	get effects(): AnimationEffect[] {
		return this.children.map(effect => {
			if (effect instanceof GroupEffect)
				return effect.effects;
			return effect;
		}).flat();
	}

	abstract getComputedTiming(): ComputedEffectTiming;
	abstract getTiming(): EffectTiming;
	abstract updateTiming(timing?: OptionalEffectTiming): void;
}

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
};

// TODO: implement timing method
// export class SequenceEffect extends GroupEffect {
// 	constructor(effects: KeyframeEffect[]) {
// 		super(effects);
// 		if (effects.length == 0)
// 			return;
// 		const firstDelay = this.children[0].getComputedTiming().delay;
// 		let accumulatedDelay = firstDelay ? firstDelay : 0;
// 		for (let i = 1; i < this.children.length; ++i) {
// 			let {delay = 0, startTime = 0, endTime = 0} = this.children[i].getComputedTiming();
// 			if (startTime instanceof CSSNumericValue)
// 				startTime = startTime.to('ms').value;
// 			if (endTime instanceof CSSNumericValue)
// 				endTime = endTime.to('ms').value;

// 			if (delay)
// 				accumulatedDelay += delay;

// 			accumulatedDelay += (endTime - startTime);
// 			this.children[i].updateTiming({delay: accumulatedDelay});
// 		}
// 	}
// }

// TODO: implement timing method
// export class StaggerEffect extends GroupEffect {
// 	constructor(effects: AnimationEffect[], staggerOptions: StaggerOptions) {
// 		super(effects);
// 		if (effects.length == 0)
// 			return;
// 		let emanation = staggerOptions.emanation;
// 		if (emanation < 0 || emanation >= this.children.length)
// 			return;
// 		for (let i = 0; i < this.children.length; ++i) {
// 			let delay = this.children[i].getComputedTiming().delay ?? 0;
// 			delay += this.calculateDistance(emanation, i, staggerOptions) * staggerOptions.delay;
// 			const easing = staggerOptions.easing;
// 			this.children[i].updateTiming({easing, delay});
// 		}
// 	}

// 	calculateDistance(emanation: number, target: number, staggerOptions: StaggerOptions) {
// 		let row = 1, col = this.children.length;
// 		if (staggerOptions.grid) {
// 			row = staggerOptions.grid[0];
// 			col = staggerOptions.grid[1];
// 		} 
// 		let x1 = emanation % col;
// 		let y1 = Math.floor(emanation / col);

// 		let x2 = target % col;
// 		let y2 = Math.floor(target / col);

// 		return Math.sqrt(Math.pow(Math.abs(x1-x2),2) + Math.pow(Math.abs(y1-y2),2));
// 	}
// }
