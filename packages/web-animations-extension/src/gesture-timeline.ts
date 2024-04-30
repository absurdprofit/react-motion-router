export interface GestureTimelineOptions {
	source: Element;
	axis: "x" | "y" | "both";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export class GestureTimeline implements AnimationTimeline {
	constructor(options?: GestureTimelineOptions) {

	}

	get currentTime() {
		return null;
	}
}