export class HistoryEntry implements Omit<NavigationHistoryEntry, 'url'> {
  public readonly routerId: string;
  readonly #nativeEntry: NavigationHistoryEntry;
  public readonly index: number;

  constructor(
    nativeEntry: NavigationHistoryEntry,
    routerId: string,
    index: number
  ) {
    this.#nativeEntry = nativeEntry;
    this.routerId = routerId;
    this.index = index;
  }

  public set ondispose(
    handler: ((this: NavigationHistoryEntry, ev: Event) => void) | null
  ) {
    this.#nativeEntry.ondispose = handler;
  }

  public get ondispose() {
    return this.#nativeEntry.ondispose;
  }

  public get id() {
    return this.#nativeEntry.id;
  }

  public get globalIndex() {
    return this.#nativeEntry.index;
  }

  public get url() {
    if (!this.#nativeEntry.url) return null;
    return new URL(this.#nativeEntry.url);
  }

  public get key() {
    return this.#nativeEntry.key;
  }

  public get sameDocument() {
    return this.#nativeEntry.sameDocument;
  }

  public addEventListener<K extends keyof NavigationHistoryEntryEventMap>(
    type: K,
    listener: (
      this: NavigationHistoryEntry,
      ev: NavigationHistoryEntryEventMap[K]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  public addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  public addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    this.#nativeEntry.addEventListener(type, listener, options);

    return () => this.#nativeEntry.removeEventListener(type, listener, options);
  }

  public removeEventListener<K extends keyof NavigationHistoryEntryEventMap>(
    type: K,
    listener: (
      this: NavigationHistoryEntry,
      ev: NavigationHistoryEntryEventMap[K]
    ) => void,
    options?: boolean | EventListenerOptions
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    this.#nativeEntry.addEventListener(type, listener, options);
  }

  public dispatchEvent(event: Event): boolean {
    return this.#nativeEntry.dispatchEvent(event);
  }

  public getState<T>() {
    return this.#nativeEntry.getState() as T;
  }
}