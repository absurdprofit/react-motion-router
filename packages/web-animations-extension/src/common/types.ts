import { Animation } from "../animation";
import { GestureTimelineOptions, GestureTimelineUpdateEvent } from "../gesture-timeline";
import { GroupEffect } from "../group-effect";

export type NativeAnimation = globalThis.Animation;
export const NativeAnimation = window.Animation;
export type NativeKeyframeEffect = globalThis.KeyframeEffect;
export const NativeKeyframeEffect = window.KeyframeEffect;
export type NativeAnimationEffect = globalThis.AnimationEffect;
export const NativeAnimationEffect = window.AnimationEffect;

export type Input = Record<string, number>;
export type Output = Record<string, number>;
export type Weights = Record<string, number>;
export type LerpRange = { min: Input, max: Input };

export function is1DRange(range: number[] | LerpRange): range is number[] {
	return Array.isArray(range);
}

export interface SpringToLinearProps {
	mass?: number;
	stiffness?: number;
	damping?: number;
	velocity?: number;
	steps?: number;
}

export interface AnimationDetails {
	timeline: AnimationTimeline | null;
	effect: AnimationEffect | null;
	replaceState: AnimationReplaceState;
	pending: {
		task: "play" | "pause" | null;
		playbackRate: number | null;
	};
	startTime: CSSNumberish | null;
	holdTime: CSSNumberish | null;
	children: (NativeAnimation | Animation)[];
	onGestureTimelineUpdate(this: Animation, { currentTime }: GestureTimelineUpdateEvent): void
}

export interface ParallelEffectDetails {
	timing: OptionalEffectTiming;
}

export interface GroupEffectDetails {
	children: AnimationEffect[];
	parent: GroupEffect | null;
}

export interface GestureTimelineDetails {
	options: GestureTimelineOptions;
	currentTime: CSSNumericValue;
}

export type TimelinePhase = "inactive" | "active";

export function isNull(value: unknown): value is null {
	return typeof value === 'object' && value === null;
}

export type AnimationEffectPhase = 'before' | 'active' | 'after' | 'idle';
