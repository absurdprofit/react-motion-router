import { PinchEvent, RotateEvent, SwipeEvent, PanEvent } from "web-gesture-events";
import { cssNumberishToNumber, interpolate } from "./common/utils";
import { MAX_DURATION_PERCENTAGE, MIN_DURATION_PERCENTAGE } from "./common/constants";

export class GestureTimelineUpdateEvent extends Event {
	public readonly currentTime;
	constructor(currentTime: CSSNumericValue) {
		super('update', { bubbles: false, cancelable: false, composed: false });
		this.currentTime = currentTime;
	}
}

export interface GestureTimelineEventMap {
	"update": GestureTimelineUpdateEvent;
}

export interface SwipeTimelineOptions {
	type: "swipe";
	axis: "x" | "y";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export interface PanTimelineOptions {
	type: "pan";
	rangeStart: {
		x: CSSNumberish;
		y: CSSNumberish;
	};
	rangeEnd: {
		x: CSSNumberish;
		y: CSSNumberish;
	};

}

export interface RotateTimelineOptions {
	type: "rotate";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export interface ScaleTimelineOptions {
	type: "pinch";
	rangeStart: CSSNumberish;
	rangeEnd: CSSNumberish;
}

export type GestureTimelineOptions = (SwipeTimelineOptions | RotateTimelineOptions | ScaleTimelineOptions | PanTimelineOptions) & {
	source: HTMLElement;
};

export class GestureTimeline extends EventTarget implements AnimationTimeline {
	private readonly options;
	private _currentTime: CSSNumericValue = CSSNumericValue.parse("0%");
	constructor(options: GestureTimelineOptions = { type: "swipe", axis: "x", rangeStart: 0, rangeEnd: window.screen.availWidth, source: document.body }) {
		super();
		options.source.addEventListener(options.type, this.onGesture.bind(this));
		this.options = options;
	}

	private onGesture(event: PinchEvent	| RotateEvent | SwipeEvent | PanEvent) {
		const sourceRect = this.options.source.getBoundingClientRect();
		let percent = 0;
		const position = {
			x: event.x - sourceRect.left,
			y: event.y - sourceRect.top
		};
		switch(this.options.type) {
			case "swipe": {
				const { rangeStart, rangeEnd } = this.options;
				const axis = this.options.axis;
				percent = interpolate(
					position[axis],
					[cssNumberishToNumber(rangeStart, 'px'), cssNumberishToNumber(rangeEnd, 'px')],
					[MIN_DURATION_PERCENTAGE, MAX_DURATION_PERCENTAGE]
				);
				break;
			}
			case "pan": {
				const { rangeStart, rangeEnd } = this.options;
				const { x, y } = position;
				percent = interpolate(
					{ x, y },
					{
						min: { x: cssNumberishToNumber(rangeStart.x, 'px'), y: cssNumberishToNumber(rangeStart.y, 'px') },
						max: { x: cssNumberishToNumber(rangeEnd.x, 'px'), y: cssNumberishToNumber(rangeEnd.y, 'px') }
					},
					[MIN_DURATION_PERCENTAGE, MAX_DURATION_PERCENTAGE],
					{ x: 1, y: 1 }
				);
				break;
			}
			case "pinch": {
				const { rangeStart, rangeEnd } = this.options;
				const { scale } = event as PinchEvent;
				percent = interpolate(
					scale,
					[cssNumberishToNumber(rangeStart, ''), cssNumberishToNumber(rangeEnd, '')],// figure out which unit
					[MIN_DURATION_PERCENTAGE, MAX_DURATION_PERCENTAGE]
				);
				break;
			}
			case "rotate": {
				const { rangeStart, rangeEnd } = this.options;
				const { rotation } = event as RotateEvent;
				percent = interpolate(
					rotation,
					[cssNumberishToNumber(rangeStart, 'deg'), cssNumberishToNumber(rangeEnd, 'deg')],
					[MIN_DURATION_PERCENTAGE, MAX_DURATION_PERCENTAGE]
				);
			}
		}

		this._currentTime = CSSNumericValue.parse(`${percent}%`);
		this.dispatchEvent(new GestureTimelineUpdateEvent(this._currentTime));
	}

	addEventListener<K extends keyof GestureTimelineEventMap>(type: K, listener: (ev: GestureTimelineEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		super.addEventListener(type, listener, options);
	}

	removeEventListener<K extends keyof GestureTimelineEventMap>(type: K, listener: (ev: GestureTimelineEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		super.removeEventListener(type, listener, options);
	}

	get currentTime() {
		return this._currentTime;
	}
}