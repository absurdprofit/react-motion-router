export interface PageAnimationStartDetail {}

export type PageAnimationStartEvent = CustomEvent<PageAnimationStartDetail>;

export interface PageAnimationCancelDetail {}

export type PageAnimationCancelEvent = CustomEvent<PageAnimationCancelDetail>;

export interface PageAnimationEndDetail {}

export type PageAnimationEndEvent = CustomEvent<PageAnimationEndDetail>;

export interface MotionProgressStartDetail {}

export type MotionProgressStartEvent = CustomEvent<MotionProgressStartDetail>;

export interface MotionProgressDetail {
    progress: number;
}

export type MotionProgressEvent = CustomEvent<MotionProgressDetail>;

export interface MotionProgressEndDetail {}

export type MotionProgressEndEvent = CustomEvent<MotionProgressEndDetail>;
