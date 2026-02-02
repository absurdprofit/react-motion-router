import { SINGLE_ELEMENT_LENGTH } from './constants';
import { LoadNavigationTransition } from './types';
import { PromiseAllSequential } from './utils';

export class LoadEvent extends Event implements Omit<
  NavigateEvent,
  'navigationType' | 'commit'
> {
  #navigationType = 'load' as const;
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
  #transition: LoadNavigationTransition | null = null;
  public readonly hasUAVisualTransition = false;

  constructor(entry?: NavigationHistoryEntry | null) {
    super('navigate', { cancelable: false, bubbles: false, composed: false });
    entry ??= window.navigation.currentEntry;
    if (!entry) throw new Error('Current entry is null');
    this.#destination = {
      getState() {
        return entry.getState();
      },
      url: entry.url ?? new URL(window.location.href).href,
      key: entry.key,
      index: entry.index,
      id: entry.id,
      sameDocument: true,
    };

    this.#signal = this.#abortable.signal;
    window.navigation.addEventListener(
      'navigate',
      this.#onNavigate,
      { signal: this.#signal }
    );
  }

  #onNavigate = (e: Event) => {
    if (e !== this) {
      this.#abortable.abort();
    } else if (!this.#thenables.length) {
      window.navigation.removeEventListener('navigate', this.#onNavigate);
    }
  };

  public intercept(options?: NavigationInterceptOptions | undefined): void {
    if (this.#intercepted) throw new DOMException('Failed to execute \'intercept\' on \'NavigateEvent\': intercept() may only be called while the navigate event is being dispatched.');
    let finish: () => void | null = null;
    if (!this.#transition) {
      this.#transition = {
        finished: new Promise((resolve) => finish = resolve),
        from: window.navigation.currentEntry!,
        navigationType: 'load' as const,
      };
    }
    const thenable = options?.handler?.();
    if (thenable) this.#thenables.push(thenable);
    if (this.#thenables.length === SINGLE_ELEMENT_LENGTH) {
      PromiseAllSequential(this.#thenables).then(() => {
        this.#intercepted = true;
        window.removeEventListener('navigate', this.#onNavigate);
        finish?.();
      });
    }
  }

  public scroll(): void {
    throw new Error('Method not implemented.');
  }

  public get transition() {
    return this.#transition;
  }

  public get navigationType() {
    return this.#navigationType;
  }

  public get userInitiated() {
    return this.#userInitiated;
  }

  public get canIntercept() {
    return this.#canIntercept;
  }

  public get hashChange() {
    return this.#hashChange;
  }

  public get formData() {
    return this.#formData;
  }

  public get downloadRequest() {
    return this.#downloadRequest;
  }

  public get destination() {
    return this.#destination;
  }

  public get signal() {
    return this.#signal;
  }
}