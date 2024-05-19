import { GestureEvent } from "web-gesture-events";
import { PromiseAllDynamic } from "./utils";

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

export class LoadEvent extends Event implements NavigateEvent {
	readonly navigationType = "load" as NavigationTypeString;
	readonly userInitiated: boolean = false;
	readonly canIntercept: boolean = true;
	readonly hashChange: boolean = false;
	readonly formData: FormData | null = null;
	readonly downloadRequest: string | null = null;
	readonly destination: NavigationDestination;
	readonly signal: AbortSignal;
	#abortable = new AbortController();
	#intercepted = false;
	#thenables: Promise<void>[] = [];

	constructor() {
		super('navigate', { cancelable: false, bubbles: false, composed: false });
		const currentEntry = window.navigation.currentEntry;
		if (!currentEntry) throw new Error("Current entry is null");
		this.destination = {
			getState() {
				return currentEntry.getState();
			},
			url: currentEntry.url ?? new URL(window.location.href).href,
			key: currentEntry.key,
			index: currentEntry.index,
			id: currentEntry.id,
			sameDocument: true
		};

		this.signal = this.#abortable.signal;
	}

	intercept(options?: NavigationInterceptOptions | undefined): void {
		if (this.#intercepted) throw new DOMException("Failed to execute 'intercept' on 'NavigateEvent': intercept() may only be called while the navigate event is being dispatched.");
		const thenable = options?.handler?.();
		if (thenable) this.#thenables.push(thenable);
		if (this.#thenables.length === 1) {
			PromiseAllDynamic(this.#thenables).then(() => {
				this.#intercepted = true;
			});
		}
	}

	scroll(): void {
		throw new Error("Method not implemented.");
	}
}