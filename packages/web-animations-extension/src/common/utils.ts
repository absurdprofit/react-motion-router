import { MAX_DURATION_PERCENTAGE, MIN_DURATION_PERCENTAGE } from "./constants";
import { Input, LerpRange, Output, SpringToLinearProps, Weights, is1DRange } from "./types";

export function cssNumberishToNumber(value: CSSNumberish, unit: string) {
	if (value instanceof CSSNumericValue)
		return value.to(unit).value;
	return value;
}

export function percentToTime(value: CSSNumberish, endTime: CSSNumberish) {
	const time = interpolate(
		cssNumberishToNumber(value, 'percent'),
		[MIN_DURATION_PERCENTAGE, MAX_DURATION_PERCENTAGE],
		[0, cssNumberishToNumber(endTime, 'ms')]
	);
	return time;
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
	let inputInterpolatedValue;
	if (typeof input === "number" && is1DRange(inputRange)) {
		const min = { x: inputRange[0] };
		const max = { x: inputRange[1] };
		inputRange = { min, max };
		input = { x: input };
	} else {
		throw new TypeError("Input and input range must have the same dimensions.");
	}
	inputInterpolatedValue = calculateWeightedMean(input, inputRange, weights);

	if (is1DRange(outputRange)) {
		return mapRange(inputInterpolatedValue, outputRange);
	}
	// create output ranges (min/max) for each dimension and mapRange for each
	const output: Output = {};
	for (const dimension of Object.keys(outputRange.min)) {
		const min = outputRange.min[dimension];
		const max = outputRange.max[dimension];
		const range = [min, max];
		output[dimension] = mapRange(inputInterpolatedValue, range);
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