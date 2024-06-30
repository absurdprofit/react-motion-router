export class HistoryEntry implements Omit<NavigationHistoryEntry, 'url'> {
	readonly routerId: string;
	#nativeEntry: NavigationHistoryEntry;
	readonly index: number;

	constructor(nativeEntry: NavigationHistoryEntry, routerId: string, index: number) {
		this.#nativeEntry = nativeEntry;
		this.routerId = routerId;
		this.index = index;
	}

	set ondispose(handler: ((this: NavigationHistoryEntry, ev: Event) => any) | null) {
		this.#nativeEntry.ondispose = handler;
	}

	get ondispose() {
		return this.#nativeEntry.ondispose;
	}

	get id() {
		return this.#nativeEntry.id;
	}

	get globalIndex() {
		return this.#nativeEntry.index;
	}

	get url() {
		if (!this.#nativeEntry.url) return null;
		return new URL(this.#nativeEntry.url);
	}

	get key() {
		return this.#nativeEntry.key;
	}

	get sameDocument() {
		return this.#nativeEntry.sameDocument;
	}

	addEventListener<K extends keyof NavigationHistoryEntryEventMap>(type: K, listener: (this: NavigationHistoryEntry, ev: NavigationHistoryEntryEventMap[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void {
		this.#nativeEntry.addEventListener(type, listener, options);

		return () => this.#nativeEntry.removeEventListener(type, listener, options);
	}

	removeEventListener<K extends keyof NavigationHistoryEntryEventMap>(type: K, listener: (this: NavigationHistoryEntry, ev: NavigationHistoryEntryEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		this.#nativeEntry.addEventListener(type, listener, options);
	}

	dispatchEvent(event: Event): boolean {
		return this.#nativeEntry.dispatchEvent(event);
	}

	getState<T>() {
		return this.#nativeEntry.getState() as T;
	}
}