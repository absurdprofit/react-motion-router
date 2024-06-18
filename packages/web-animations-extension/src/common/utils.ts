import { GestureTimeline } from "../gesture-timeline";
import { DEFAULT_TIMING, MAX_DURATION_PERCENTAGE, MIN_DURATION_PERCENTAGE, RESOLVED_AUTO_DURATION } from "./constants";
import { AnimationEffectPhase, Input, LerpRange, Output, SpringToLinearProps, Weights, is1DRange, isNull } from "./types";

export function cssNumberishToNumber<T extends CSSNumberish | null>(value: T, unit: string) {
	if (isNull(value) || typeof value === 'number')
		return value;
	else
		return value.to(unit).value;
}

export function msFromPercent<T extends CSSNumberish | null>(value: T, timing: EffectTiming = DEFAULT_TIMING) {
	let { duration = 'auto', iterations = 1, playbackRate = 1 } = timing;
	if (isNull(value))
		return value;

	if (typeof value === 'number' || value.type().percent === undefined) {
		throw new DOMException(
			"CSSNumericValue must be a percentage for progress based animations.",
			"NotSupportedError"
		);
	}

	if (duration === 'auto') {
		duration = RESOLVED_AUTO_DURATION; // arbitrary duration
	} else if (duration instanceof CSSNumericValue) {
		duration = duration.to('ms').value;
	} else if (typeof duration === 'string') {
		throw new TypeError("Unknown effect duration keyword.");
	}

	const { delay = 0, endDelay = 0 } = timing;
	const iterationDuration = duration / iterations;
	const activeDuration = (iterationDuration * iterations) / Math.abs(playbackRate);
	const totalDuration = delay + activeDuration + endDelay;
	const time = interpolate(
		value.to('percent').value,
		[MIN_DURATION_PERCENTAGE, MAX_DURATION_PERCENTAGE],
		[0, totalDuration]
	);
	return time;
}

export function msFromTime<T extends CSSNumberish | null>(value: T) {
	if (isNull(value) || typeof value === 'number')
		return value;

	if (value.type().time !== undefined) {
		throw new DOMException(
			"CSSNumericValue must be a time value for time based animations.",
			"NotSupportedError"
		);
	}

	return value.to('ms').value;
}

function mapRange(input: number, outputRange: number[]): number {
	const segments = outputRange.length - 1;
	const segmentIndex = Math.floor(input * segments);
	const segmentMin = outputRange[segmentIndex];
	const segmentMax = outputRange[Math.min(segmentIndex + 1, segments)];
	const segmentInput = (input * segments) - segmentIndex;
	return segmentMin + segmentInput * (segmentMax - segmentMin);
}

function calculateWeightedMean(input: Input, range: LerpRange, weights: Weights) {
	let weightedSum = 0;
	let weightSum = 0;
	for (const [dimension, inputValue] of Object.entries(input)) {
		const { min, max } = range;
		const weight = weights[dimension] ?? 1;
		const normalised = (inputValue - min[dimension]) / (max[dimension] - min[dimension]);
		const weighted = normalised * weight;
		weightedSum += weighted;
		weightSum += weight;
	}
	return weightedSum / weightSum;
}

export function interpolate<O extends LerpRange | number[]>(input: number, inputRange: [number, number], outputRange: O): O extends number[] ? number : Output;
export function interpolate<O extends LerpRange | number[]>(input: Input, inputRange: LerpRange, outputRange: O, weights: Weights): O extends number[] ? number : Output;
export function interpolate(input: Input | number, inputRange: LerpRange | number[], outputRange: number[] | LerpRange, weights: Weights = {}) {
	let normalisedInputValue;
	if (typeof input === "number" && is1DRange(inputRange)) {
		const min = { x: inputRange[0] };
		const max = { x: inputRange[1] };
		inputRange = { min, max };
		input = { x: input };
	} else {
		throw new TypeError("Input and input range must have the same dimensions.");
	}

	// normalise input value in 0-1 range
	normalisedInputValue = calculateWeightedMean(input, inputRange, weights);
	// clamp normalised input
	normalisedInputValue = clamp(normalisedInputValue, 0, 1);

	if (is1DRange(outputRange)) {
		return mapRange(normalisedInputValue, outputRange);
	}
	// create output ranges (min/max) for each dimension and mapRange for each
	const output: Output = {};
	for (const dimension of Object.keys(outputRange.min)) {
		const min = outputRange.min[dimension];
		const max = outputRange.max[dimension];
		const range = [min, max];
		output[dimension] = mapRange(normalisedInputValue, range);
	}
	return output;
}

export function springToLinear({ mass = 1, stiffness = 10, damping = 10, velocity = 0, steps = 100 }: SpringToLinearProps) {
	const w0 = Math.sqrt(stiffness / mass);
	const zeta = damping / (2 * Math.sqrt(stiffness * mass));
	const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
	const b = zeta < 1 ? (zeta * w0 + -velocity) / wd : -velocity + w0;

	function solver(t: number) {
		if (zeta < 1) {
			t =
				Math.exp(-t * zeta * w0) *
				(1 * Math.cos(wd * t) + b * Math.sin(wd * t));
		} else {
			t = (1 + b * t) * Math.exp(-t * w0);
		}

		return 1 - t;
	}

	const duration = (() => {
		const step = 1 / steps;
		let time = 0;

		while (true) {
			if (Math.abs(1 - solver(time)) < 0.001) {
				const restStart = time;
				let restSteps = 1;
				while (true) {
					time += step;
					if (Math.abs(1 - solver(time)) >= 0.001) break;
					restSteps++;
					if (restSteps === 16) return restStart;
				}
			}
			time += step;
		}
	})() * 1000;

	const easing = (() => {
		let easingPoints = [];

		for (let i = 0; i <= steps; i++) {
			const t = i / steps; // normalize time from 0 to 1
			const easedValue = solver(t);
			easingPoints.push(easedValue);
		}

		// Construct the CSS linear() function string
		return `linear(${easingPoints.join(', ')})`;
	})();

	return { duration, easing } as const;
}

export function easingToLinear(easing: (t: number) => number, steps = 100) {
	let easingPoints = [];

	for (let i = 0; i <= steps; i++) {
		const t = i / steps; // normalize time from 0 to 1
		const easedValue = easing(t);
		easingPoints.push(easedValue);
	}

	// Construct the CSS linear() function string
	return `linear(${easingPoints.join(', ')})`;
}

export function clamp(num: number, min: number, max?: number) {
	if (num < min) {
			return min;
	} else if (max && num > max) {
			return max;
	}
	return num;
}

export function computedTimingToPercent(computedTiming: ComputedEffectTiming, timeline: GestureTimeline) {
	let {
		duration = 'auto',
		iterations = 1,
		playbackRate = 1,
		iterationStart = 0,
		delay = 0,
		endDelay = 0,
		progress = null,
		endTime
	} = computedTiming;

	endTime = new CSSUnitValue(100, 'percent');
	if (duration === 'auto') {
		duration = RESOLVED_AUTO_DURATION; // arbitrary duration
		delay = 0;
		endDelay = 0;
	} else if (duration instanceof CSSNumericValue) {
		duration = duration.to('ms').value;
	} else if (typeof duration === 'string') {
		throw TypeError("Unknown effect duration keyword.");
	}

	const iterationDurationMs = duration / iterations;
	const activeDurationMs = (iterationDurationMs * iterations) / Math.abs(playbackRate);
	const totalTimeMs = delay + activeDurationMs + endDelay;
	duration = new CSSUnitValue((iterationDurationMs / totalTimeMs) * 100, 'percent');
	const activeDuration = CSS.percent((duration.to('percent').value * iterations) / Math.abs(playbackRate));
	const localTime = timeline.currentTime;
	if (localTime !== null)
		progress = localTime.to('percent').value / CSS.percent(100).value;

	return {
		...computedTiming,
		localTime,
		activeDuration,
		duration,
		iterations,
		playbackRate,
		iterationStart,
		delay,
		endDelay,
		progress,
		endTime
	};
}


export function getPhase(timing: ComputedEffectTiming, animationDirection: "forwards" | "backwards"): AnimationEffectPhase {
	const { activeDuration = 0, localTime, endTime = Infinity, delay = 0 } = timing;
	
	if (localTime == null || localTime === undefined) {
		return 'idle';
	}
	
	const beforeActiveBoundaryTime = Math.max(Math.min(delay, msFromTime(endTime)), 0);
	const activeAfterBoundaryTime = Math.max(Math.min(delay + msFromTime(activeDuration), msFromTime(endTime)), 0);
	
	if (
		msFromTime(localTime) < beforeActiveBoundaryTime ||
		(animationDirection === 'backwards' && localTime === beforeActiveBoundaryTime)
	) {
		return 'before';
	}
	
	if (
		msFromTime(localTime) > activeAfterBoundaryTime ||
		(animationDirection === 'forwards' && localTime === activeAfterBoundaryTime)
	) {
		return 'after';
	}
	
	return 'active';
}

export function calculateActiveTime(timing: ComputedEffectTiming, phase: AnimationEffectPhase): number | null {
	const { localTime, delay = 0, activeDuration = 0, fill } = timing;
  
	if (localTime == null || localTime === undefined) {
	  return null; // Unresolved time value
	}
  
	switch (phase) {
	  case 'before':
		if (fill === 'backwards' || fill === 'both') {
		  return Math.max(msFromTime(localTime) - delay, 0);
		} else {
		  return null; // Unresolved time value
		}
  
	  case 'active':
		return msFromTime(localTime) - delay;
  
	  case 'after':
		if (fill === 'forwards' || fill === 'both') {
		  return Math.max(Math.min(msFromTime(localTime) - delay, msFromTime(activeDuration)), 0);
		} else {
		  return null; // Unresolved time value
		}
  
	  default:
		return null; // Unresolved time value
	}
}

export function calculateOverallProgress(timing: ComputedEffectTiming, phase: AnimationEffectPhase, activeTime: number) {
	const { duration = 0, iterations = 1, iterationStart = 0 } = timing;
	
	let overallProgress = 0;

	if (duration === 0)
		if (phase === "before")
			overallProgress = 0;
		else
			overallProgress = iterations;
	else
		overallProgress =  activeTime / duration;

	return overallProgress + iterationStart;
}

export function calculateSimpleIterationProgress(timing: ComputedEffectTiming, phase: AnimationEffectPhase, overallProgress: number, activeTime: number) {
	const { iterations = 1, iterationStart = 0 , activeDuration = 0 } = timing;

	if (isNull(overallProgress))
		return null;

	let simpleIterationProgress = 0;
	if (overallProgress === Infinity)
		simpleIterationProgress = iterationStart % 1;

	if (simpleIterationProgress === 0
		&& (phase === "active" || phase === "after")
		&& activeDuration === activeTime
		&& iterations !== 0
	) simpleIterationProgress = 1;

	return simpleIterationProgress;
}

export function calculateCurrentIterationIndex(timing: ComputedEffectTiming, phase: AnimationEffectPhase) {
	const { iterations = 1 } = timing;
	const activeTime = calculateActiveTime(timing, phase);

	if (isNull(activeTime))
		return null;

	if (phase === "after" && iterations === Infinity)
		return Infinity;

	const overallProgress = calculateOverallProgress(timing, phase, activeTime);
	const simpleIterationProgress = calculateSimpleIterationProgress(timing, phase, overallProgress, activeTime);
	if (simpleIterationProgress === 1)
		return Math.floor(overallProgress) - 1;
	return Math.floor(overallProgress);
}