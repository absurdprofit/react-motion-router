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

export class LoadEvent extends Event implements Omit<NavigateEvent, 'navigationType'> {
	#navigationType = "load" as const;
	#userInitiated: boolean = false;
	#canIntercept: boolean = true;
	#hashChange: boolean = false;
	#formData: FormData | null = null;
	#downloadRequest: string | null = null;
	#destination: NavigationDestination;
	#signal: AbortSignal;
	#abortable = new AbortController();
	#intercepted = false;
	#thenables: Promise<void>[] = [];

	constructor() {
		super('navigate', { cancelable: false, bubbles: false, composed: false });
		const currentEntry = window.navigation.currentEntry;
		if (!currentEntry) throw new Error("Current entry is null");
		this.#destination = {
			getState() {
				return currentEntry.getState();
			},
			url: currentEntry.url ?? new URL(window.location.href).href,
			key: currentEntry.key,
			index: currentEntry.index,
			id: currentEntry.id,
			sameDocument: true
		};

		this.#signal = this.#abortable.signal;
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

	get navigationType() {
		return this.#navigationType;
	}

	get userInitiated() {
		return this.#userInitiated;
	}

	get canIntercept() {
		return this.#canIntercept;
	}

	get hashChange() {
		return this.#hashChange;
	}

	get formData() {
		return this.#formData;
	}

	get downloadRequest() {
		return this.#downloadRequest;
	}

	get destination() {
		return this.#destination;
	}

	get signal() {
		return this.#signal;
	}
}