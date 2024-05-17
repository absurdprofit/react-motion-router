import { Animation } from "../animation";
import { GestureTimelineUpdateEvent } from "../gesture-timeline";
import { GroupEffect } from "../group-effect";

enum EasingFunctionKeywordEnum {
	"ease",
	"ease-in",
	"ease-in-out",
	"ease-out",
	"linear"
}

export type EasingFunctionKeyword = keyof typeof EasingFunctionKeywordEnum;
export type EasingFunction = EasingFunctionKeyword | `cubic-bezier(${number},${' ' | ''}${number},${' ' | ''}${number},${' ' | ''}${number})`;

export type NativeAnimation = globalThis.Animation;
export const NativeAnimation = window.Animation;

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
	timeline: AnimationTimeline;
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