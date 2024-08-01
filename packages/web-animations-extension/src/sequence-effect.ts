import { associatedAnimation } from "./common/associated-animation";
import { DEFAULT_TIMING } from "./common/constants";
import { calculateCurrentIterationIndex, computedTimingToPercent, cssNumberishToNumber, getPhase, msFromTime } from "./common/utils";
import { GestureTimeline } from "./gesture-timeline";
import { GroupEffect } from "./group-effect";

export class SequenceEffect extends GroupEffect {
	#timing: OptionalEffectTiming;
	constructor(children: AnimationEffect[], timing: OptionalEffectTiming = DEFAULT_TIMING) {
		super(children);
		this.#timing = {
			...DEFAULT_TIMING,
			...timing
		};

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
		const computedTiming: ComputedEffectTiming = { ...timing };
		const { delay = 0 } = this.children.item(0)?.getComputedTiming() ?? {};
		const { endDelay = 0, endTime = 0 } = this.children.item(this.children.length - 1)?.getComputedTiming() ?? {};
		timing.delay = timing.delay ? timing.delay + delay : delay;
		timing.endDelay = timing.endDelay ? timing.endDelay + endDelay : endDelay;
		computedTiming.endTime = endTime;
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children.item(i);
			if (!child) continue;
			let {
				duration = 'auto',
				activeDuration = 0,
			} = child.getComputedTiming();
			computedTiming.activeDuration = computedTiming.activeDuration ? cssNumberishToNumber(computedTiming.activeDuration, 'ms') + cssNumberishToNumber(activeDuration, 'ms') : activeDuration;
			timing.duration = timing.duration instanceof CSSNumericValue ? timing.duration.to('ms').value : timing.duration;
			duration = duration instanceof CSSNumericValue ? duration.to('ms').value : duration;
			if (typeof duration !== 'string')
				if (timing.duration === 'auto')
					timing.duration = cssNumberishToNumber(duration, 'ms');
				else if (typeof timing.duration !== 'string')
					timing.duration = timing.duration ? timing.duration + duration : duration;
		}

		const { timeline, startTime, currentTime } = associatedAnimation.get(this) ?? {};
		const unit = timeline instanceof GestureTimeline ? 'percent' : 'ms';
		let { duration = 0, iterations = 1 } = computedTiming;
		if (duration === "auto") duration = 0;
		if (typeof duration === "string")
			throw new TypeError("Unknown effect duration keyword.");
		computedTiming.duration = duration;
		computedTiming.activeDuration = msFromTime(duration) * iterations;
		computedTiming.startTime = startTime ?? undefined;
		computedTiming.localTime = currentTime;
		computedTiming.currentIteration = calculateCurrentIterationIndex(computedTiming, getPhase(computedTiming, this.#animationDirection));

		if (timeline instanceof GestureTimeline) {
			return computedTimingToPercent(computedTiming);
		} else if (timeline instanceof DocumentTimeline) {
			computedTiming.progress = currentTime && cssNumberishToNumber(currentTime, unit) / cssNumberishToNumber(endTime, unit); // average progress
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

	get #animationDirection(): 'forwards' | 'backwards' {
		const { playbackRate = 1 } = associatedAnimation.get(this) ?? {};
		return playbackRate < 0 ? 'backwards' : 'forwards';
	}
}