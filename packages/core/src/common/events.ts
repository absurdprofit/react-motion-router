import { SINGLE_ELEMENT_LENGTH } from './constants';
import { PromiseWrapper } from './promise-wrapper';
import { LoadNavigationTransition } from './types';
import { PromiseAllSequential } from './utils';

export class LoadEvent extends Event implements Omit<
  NavigateEvent,
  'navigationType' | 'commit'
> {
  #navigationType: 'load' | 'preload';
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
  #finished = new PromiseWrapper<void>();
  public readonly hasUAVisualTransition = false;

  constructor(
    navigationType: 'load' | 'preload',
    loadEventInitDict?: { destination?: NavigationDestination | null }
  ) {
    super('navigate', { cancelable: false, bubbles: false, composed: false });

    this.#navigationType = navigationType;
    const {
      destination = window.navigation.currentEntry,
    } = loadEventInitDict ?? {};
    if (!destination) throw new Error('Destination is null');
    this.#destination = {
      getState() {
        return destination.getState();
      },
      url: destination.url ?? new URL(window.location.href).href,
      key: destination.key,
      index: destination.index,
      id: destination.id,
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
    
    const thenable = options?.handler?.();
    if (thenable) this.#thenables.push(thenable);
    if (this.#thenables.length === SINGLE_ELEMENT_LENGTH) {
      PromiseAllSequential(this.#thenables).then(() => {
        this.#intercepted = true;
        window.removeEventListener('navigate', this.#onNavigate);
        this.#finished.resolve();
      });
    }
  }

  public scroll(): void {
    throw new Error('Method not implemented.');
  }

  public get transition() {
    if (!this.#transition) {
      this.#transition = {
        finished: this.#finished.promise,
        from: window.navigation.currentEntry!,
        navigationType: this.#navigationType,
      };
    }
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