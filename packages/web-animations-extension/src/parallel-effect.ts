import { associatedAnimation } from "./common/associated-animation";
import { DEFAULT_TIMING } from "./common/constants";
import { AnimationEffectPhase } from "./common/types";
import { clamp, computedTimingToPercent, cssNumberishToNumber, msFromTime } from "./common/utils";
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
				duration = 'auto',
				activeDuration = 0,
				endTime = 0,
				startTime = 0
			} = child.getComputedTiming();
			timing.delay = timing.delay ? Math.min(timing.delay, delay) : delay;
			timing.endDelay = timing.endDelay ? Math.max(timing.endDelay, endDelay) : endDelay;
			computedTiming.endTime = computedTiming.endTime ? Math.max(cssNumberishToNumber(computedTiming.endTime, 'ms'), cssNumberishToNumber(endTime, 'ms')) : endTime;
			computedTiming.startTime = computedTiming.startTime ? Math.min(cssNumberishToNumber(computedTiming.startTime, 'ms'), cssNumberishToNumber(startTime, 'ms')) : startTime;
			computedTiming.activeDuration = computedTiming.activeDuration ? Math.max(cssNumberishToNumber(computedTiming.activeDuration, 'ms'), cssNumberishToNumber(activeDuration, 'ms')) : activeDuration;
			timing.duration = timing.duration instanceof CSSNumericValue ? timing.duration.to('ms').value : timing.duration;
			duration = duration instanceof CSSNumericValue ? duration.to('ms').value : duration;
			if (typeof duration !== 'string')
				if (timing.duration === 'auto')
					timing.duration = cssNumberishToNumber(duration, 'ms');
				else if (typeof timing.duration !== 'string')
					timing.duration = timing.duration ? Math.max(timing.duration, duration) : duration;
		}

		const { timeline, startTime, currentTime } = associatedAnimation.get(this) ?? {};
		computedTiming.startTime = startTime ?? undefined;
		computedTiming.localTime = currentTime;
		// computedTiming.progress = cssNumberishToNumber(currentTime, 'ms') / cssNumberishToNumber(activeDuration, 'ms');

		// TODO: calculate iteration index https://drafts.csswg.org/web-animations-1/#calculating-the-current-iteration

		if (timeline instanceof GestureTimeline) {
			return computedTimingToPercent(computedTiming, timeline);
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

	#getAnimationDirection(): 'forwards' | 'backwards' {
		const { playbackRate = 1 } = associatedAnimation.get(this) ?? {};
		return playbackRate < 0 ? 'backwards' : 'forwards';
	}
	  
	static #getPhase(timing: ComputedEffectTiming, animationDirection: "forwards" | "backwards"): AnimationEffectPhase {
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

	#getActiveTime(timing: ComputedEffectTiming, phase: AnimationEffectPhase): number | null {
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
}