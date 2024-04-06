import { GestureEvent } from "web-gesture-events";

export interface TransitionStartDetail {}

export type TransitionStartEvent = CustomEvent<TransitionStartDetail>;

export interface TransitionCancelDetail {}

export type TransitionCancelEvent = CustomEvent<TransitionCancelDetail>;

export interface TransitionEndDetail {}

export type TransitionEndEvent = CustomEvent<TransitionEndDetail>;

export interface GestureStartDetail {
    source: GestureEvent;
}
export type GestureStartEvent = CustomEvent<GestureStartDetail>;

export interface GestureEndDetail {
    source: GestureEvent;
}
export type GestureEndEvent = CustomEvent<GestureEndDetail>;

export type GestureCancelEvent = CustomEvent;

export interface MotionProgressStartDetail {}

export type MotionProgressStartEvent = CustomEvent<MotionProgressStartDetail>;

export interface MotionProgressDetail {
    progress: number;
}

export type MotionProgressEvent = CustomEvent<MotionProgressDetail>;

export interface MotionProgressEndDetail {}

export type MotionProgressEndEvent = CustomEvent<MotionProgressEndDetail>;
