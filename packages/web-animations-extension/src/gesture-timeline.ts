export interface SwipeTimelineOptions {
	type: "swipe";
	axis: "x" | "y" | "both";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export interface RotateTimelineOptions {
	type: "rotate";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export interface ScaleTimelineOptions {
	type: "scale";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export type GestureTimelineOptions = SwipeTimelineOptions | RotateTimelineOptions;

export class GestureTimeline implements AnimationTimeline {
	constructor(options?: GestureTimelineOptions) {

	}

	get currentTime() {
		return null;
	}
}