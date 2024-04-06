import { GestureEvent } from "web-gesture-events";

export class TransitionStartEvent extends Event {
    constructor() {
        super('transition-start');
    }
}

export class TransitionCancelEvent extends Event {
    constructor() {
        super('transition-cancel');
    }
}

export class TransitionEndEvent extends Event {
    constructor() {
        super('transition-end');
    }
}

export class GestureStartEvent extends Event {
    readonly source: GestureEvent;

    constructor(source: GestureEvent) {
        super('gesture-start');
        this.source = source;
    }
}

export class GestureEndEvent extends Event {
    readonly source: GestureEvent;

    constructor(source: GestureEvent) {
        super('gesture-end');
        this.source = source;
    }
}

export class GestureCancelEvent extends Event {
    constructor() {
        super('gesture-cancel');
    }
}

export class MotionProgressStartEvent extends Event {
    constructor() {
        super('motion-progress-start');
    }
}

export class MotionProgressEvent extends Event {
    readonly progress: number;

    constructor(progress: number) {
        super('motion-progress');
        this.progress = progress;
    }
}

export class MotionProgressEndEvent extends Event {
    constructor() {
        super('motion-progress-end');
    }
}