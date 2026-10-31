import type {
  NavigationFacadeOptions,
  NavigationNavigateOptions,
  NavigationOptions,
  NavigationReloadOptions,
  NavigationResultLike,
  NavigationEntryLike,
  NavigationApiLike,
  NavigationNavigateEventLike,
  NavigationCurrentEntryChangeEventLike,
  NavigationDestinationLike,
  NavigationNavigateErrorEventLike
} from './index';

type NavigationType = 'push' | 'replace' | 'traverse' | 'reload';

interface StoredEntry {
  key: string;
  id: string;
  url: string;
  state: unknown;
  sameDocument?: boolean;
}

interface StoredNavigation {
  version: 1;
  entries: StoredEntry[];
  index: number;
}

export class NavigationFacadeCurrentEntryChangeEvent extends Event implements NavigationCurrentEntryChangeEventLike {
  readonly navigationType: NavigationType | null;
  readonly from: NavigationFacadeEntry;

  constructor(navigationType: NavigationType | null, from: NavigationFacadeEntry) {
    super('currententrychange');
    this.navigationType = navigationType;
    this.from = from;
  }
}

export class NavigationFacadeNavigateErrorEvent extends Event implements NavigationNavigateErrorEventLike {
  readonly error: unknown;
  readonly message: string;

  constructor(error: unknown) {
    super('navigateerror');
    this.error = error;
    this.message = error instanceof Error ? error.message : String(error);
  }
}

interface NavigateDetail {
  navigationType: NavigationType;
  destination: NavigationFacadeDestination;
  signal: AbortSignal;
  info: unknown;
  readonly canIntercept: boolean;
  readonly userInitiated: boolean;
  readonly hashChange: boolean;
  readonly hasUAVisualTransition: boolean;
  readonly formData: FormData | null;
  readonly downloadRequest: string | null;
  readonly sourceElement: Element | null;
  intercept(options?: { handler?: () => void | Promise<void> }): void;
}

interface NavigateContext {
  userInitiated: boolean;
  formData: FormData | null;
  sourceElement: Element | null;
  preserveEmptyQuery?: boolean;
}

interface FormSubmitInterceptor {
  originalDescriptor: PropertyDescriptor | undefined;
  wrapper: HTMLFormElement['submit'];
  facades: Map<Document, Array<{
    owner: NavigationFacade;
    intercept: (form: HTMLFormElement) => boolean;
  }>>;
}

const formSubmitInterceptors = new WeakMap<object, FormSubmitInterceptor>();

export class NavigationFacadeEntry extends EventTarget implements NavigationEntryLike {
  readonly key: string;
  readonly id: string;
  readonly url: string;
  readonly index: number;
  readonly sameDocument: boolean;
  private state: unknown;

  constructor(entry: StoredEntry, index: number) {
    super();
    this.key = entry.key;
    this.id = entry.id;
    this.url = entry.url;
    this.index = index;
    this.sameDocument = entry.sameDocument ?? true;
    this.state = entry.state;
  }

  getState(): unknown {
    return this.state;
  }

  setState(state: unknown): void {
    this.state = state;
  }
}

class NavigationFacadeDestination implements NavigationDestinationLike {
  readonly url: string;
  readonly key: string;
  readonly id: string;
  readonly index: number;
  readonly sameDocument: boolean;
  private readonly state: unknown;

  constructor(entry: NavigationFacadeEntry, hasExistingEntry: boolean) {
    this.url = entry.url;
    this.key = hasExistingEntry ? entry.key : '';
    this.id = hasExistingEntry ? entry.id : '';
    this.index = hasExistingEntry ? entry.index : -1;
    this.sameDocument = entry.sameDocument;
    this.state = entry.getState();
  }

  getState(): unknown {
    return this.state;
  }
}

class NavigationFacadeNavigateEvent extends Event implements NavigateDetail, NavigationNavigateEventLike {
  readonly navigationType: NavigationType;
  readonly destination: NavigationFacadeDestination;
  readonly signal: AbortSignal;
  readonly info: unknown;
  readonly userInitiated: boolean;
  readonly hashChange: boolean;
  readonly hasUAVisualTransition = false;
  readonly formData: FormData | null;
  readonly downloadRequest = null;
  readonly sourceElement: Element | null;
  private handler?: () => void | Promise<void>;
  private canInterceptValue = true;

  constructor(
    navigationType: NavigationType,
    destination: NavigationFacadeEntry,
    from: NavigationFacadeEntry,
    signal: AbortSignal,
    info: unknown,
    context: NavigateContext
  ) {
    super('navigate', { cancelable: true });
    this.navigationType = navigationType;
    this.destination = new NavigationFacadeDestination(
      destination,
      navigationType === 'traverse'
    );
    this.signal = signal;
    this.info = info;
    this.userInitiated = context.userInitiated;
    this.formData = context.formData;
    this.sourceElement = context.sourceElement;
    const fromUrl = new URL(from.url);
    const destinationUrl = new URL(destination.url);
    const fromHash = fromUrl.hash;
    const destinationHash = destinationUrl.hash;
    fromUrl.hash = '';
    destinationUrl.hash = '';
    this.hashChange = fromUrl.href === destinationUrl.href && fromHash !== destinationHash;
  }

  get canIntercept(): boolean {
    return this.canInterceptValue;
  }

  intercept(options: { handler?: () => void | Promise<void> } = {}): void {
    if (!this.canInterceptValue) {
      throw new DOMException('The navigation event can no longer be intercepted.', 'InvalidStateError');
    }

    if (this.handler) {
      throw new DOMException('The navigation event has already been intercepted.', 'InvalidStateError');
    }

    this.handler = options.handler;
  }

  finishDispatch(): void {
    this.canInterceptValue = false;
  }

  getInterceptHandler(): (() => void | Promise<void>) | undefined {
    return this.handler;
  }
}

export class NavigationFacade extends EventTarget implements NavigationApiLike {
  private entriesValue: StoredEntry[];
  private indexValue: number;
  private readonly storage: NavigationFacadeOptions['storage'];
  private readonly storageKey: string;
  private readonly entryCache = new Map<string, NavigationFacadeEntry>();
  private transitionValue: { from: NavigationFacadeEntry; finished: Promise<void> } | null = null;
  private currentEntryValue: NavigationFacadeEntry;
  private readonly eventHandlers = new Map<string, {
    handler: unknown;
    listener: EventListener;
  }>();
  private readonly navigationDocument: Document | undefined;
  private readonly navigationTarget: Window | undefined;
  private readonly formSubmitPrototype: object | undefined;
  private readonly clickListener: EventListener;
  private readonly submitListener: EventListener;

  constructor(options: NavigationFacadeOptions = {}) {
    super();
    this.storage = options.storage === undefined
      ? (typeof window === 'undefined' ? null : window.localStorage)
      : options.storage;
    this.storageKey = options.storageKey ?? '@react-motion-router/navigation-api';

    const initialUrl = new URL(
      options.initialUrl?.toString()
        ?? (typeof window === 'undefined' ? 'http://localhost/' : window.location.href)
    );
    const stored = this.readStoredNavigation(initialUrl);
    this.entriesValue = stored?.entries ?? [this.createEntry(initialUrl.href)];
    this.indexValue = stored?.index ?? 0;
    this.currentEntryValue = this.toEntry(this.entriesValue[this.indexValue], this.indexValue);

    if (!stored) {
      this.persist();
    }

    this.navigationDocument = typeof document === 'undefined' ? undefined : document;
    this.navigationTarget = this.navigationDocument && typeof window !== 'undefined'
      ? window
      : undefined;
    this.clickListener = event => this.handleDocumentClick(event as MouseEvent);
    this.submitListener = event => this.handleFormSubmit(event as SubmitEvent);
    this.navigationTarget?.addEventListener('click', this.clickListener);
    this.navigationTarget?.addEventListener('submit', this.submitListener);
    this.formSubmitPrototype = this.installFormSubmitInterceptor();
  }

  get currentEntry(): NavigationFacadeEntry {
    return this.currentEntryValue;
  }

  get onnavigate(): ((this: NavigationApiLike, event: NavigationNavigateEventLike) => unknown) | null {
    return this.getHandler<NavigationNavigateEventLike>('navigate');
  }

  set onnavigate(handler: ((this: NavigationApiLike, event: NavigationNavigateEventLike) => unknown) | null) {
    this.setHandler<NavigationNavigateEventLike>('navigate', handler);
  }

  get onnavigatesuccess(): ((this: NavigationApiLike, event: Event) => unknown) | null {
    return this.getHandler<Event>('navigatesuccess');
  }

  set onnavigatesuccess(handler: ((this: NavigationApiLike, event: Event) => unknown) | null) {
    this.setHandler<Event>('navigatesuccess', handler);
  }

  get onnavigateerror(): ((this: NavigationApiLike, event: NavigationNavigateErrorEventLike) => unknown) | null {
    return this.getHandler<NavigationNavigateErrorEventLike>('navigateerror');
  }

  set onnavigateerror(handler: ((this: NavigationApiLike, event: NavigationNavigateErrorEventLike) => unknown) | null) {
    this.setHandler<NavigationNavigateErrorEventLike>('navigateerror', handler);
  }

  get oncurrententrychange(): ((this: NavigationApiLike, event: NavigationCurrentEntryChangeEventLike) => unknown) | null {
    return this.getHandler<NavigationCurrentEntryChangeEventLike>('currententrychange');
  }

  set oncurrententrychange(handler: ((this: NavigationApiLike, event: NavigationCurrentEntryChangeEventLike) => unknown) | null) {
    this.setHandler<NavigationCurrentEntryChangeEventLike>('currententrychange', handler);
  }

  get transition(): { navigationType: NavigationType; from: NavigationFacadeEntry; finished: Promise<void> } | null {
    return this.transitionValue
      ? {
        navigationType: this.transitionType,
        from: this.transitionValue.from,
        finished: this.transitionValue.finished,
      }
      : null;
  }

  private transitionType: NavigationType = 'push';

  get canGoBack(): boolean {
    return this.indexValue > 0;
  }

  get canGoForward(): boolean {
    return this.indexValue < this.entriesValue.length - 1;
  }

  entries(): NavigationFacadeEntry[] {
    return this.entriesValue.map((entry, index) => this.toEntry(entry, index));
  }

  navigate(url: string, options: NavigationNavigateOptions = {}): NavigationResultLike {
    return this.navigateInternal(url, options, {
      userInitiated: false,
      formData: null,
      sourceElement: null,
    });
  }

  dispose(): void {
    this.navigationTarget?.removeEventListener('click', this.clickListener);
    this.navigationTarget?.removeEventListener('submit', this.submitListener);
    this.uninstallFormSubmitInterceptor();
  }

  private installFormSubmitInterceptor(): object | undefined {
    const document = this.navigationDocument;
    const FormElement = document?.defaultView?.HTMLFormElement;
    if (!document || !FormElement) {
      return undefined;
    }

    const prototype = FormElement.prototype;
    let interceptor = formSubmitInterceptors.get(prototype);
    if (!interceptor) {
      const originalDescriptor = Object.getOwnPropertyDescriptor(prototype, 'submit');
      const originalSubmit = prototype.submit;
      let createdInterceptor: FormSubmitInterceptor;
      const wrapper: HTMLFormElement['submit'] = function (this: HTMLFormElement): void {
        const active = createdInterceptor.facades.get(this.ownerDocument)?.at(-1);
        if (!active?.intercept(this)) {
          originalSubmit.call(this);
        }
      };
      createdInterceptor = {
        originalDescriptor,
        wrapper,
        facades: new Map(),
      };
      Object.defineProperty(prototype, 'submit', {
        configurable: originalDescriptor?.configurable ?? true,
        enumerable: originalDescriptor?.enumerable ?? false,
        writable: true,
        value: wrapper,
      });
      formSubmitInterceptors.set(prototype, createdInterceptor);
      interceptor = createdInterceptor;
    }

    const facades = interceptor.facades.get(document) ?? [];
    facades.push({
      owner: this,
      intercept: form => this.interceptFormSubmission(form, null, false, true),
    });
    interceptor.facades.set(document, facades);
    return prototype;
  }

  private uninstallFormSubmitInterceptor(): void {
    const prototype = this.formSubmitPrototype;
    const document = this.navigationDocument;
    if (!prototype || !document) {
      return;
    }

    const interceptor = formSubmitInterceptors.get(prototype);
    if (!interceptor) {
      return;
    }

    const facades = (interceptor.facades.get(document) ?? [])
      .filter(facade => facade.owner !== this);
    if (facades.length > 0) {
      interceptor.facades.set(document, facades);
      return;
    }
    interceptor.facades.delete(document);

    if (interceptor.facades.size === 0) {
      const prototypeWithSubmit = prototype as HTMLFormElement;
      if (prototypeWithSubmit.submit === interceptor.wrapper) {
        if (interceptor.originalDescriptor) {
          Object.defineProperty(prototype, 'submit', interceptor.originalDescriptor);
        } else {
          Reflect.deleteProperty(prototype, 'submit');
        }
      }
      formSubmitInterceptors.delete(prototype);
    }
  }

  private navigateInternal(
    url: string,
    options: NavigationNavigateOptions,
    context: NavigateContext
  ): NavigationResultLike {
    const destinationUrl = this.resolveUrl(url);
    const destinationHref = context.preserveEmptyQuery
      ? appendEmptyQueryDelimiter(destinationUrl.href)
      : destinationUrl.href;
    const history = options.history === 'auto'
      ? (destinationHref === this.currentEntry.url ? 'replace' : 'push')
      : options.history ?? 'push';
    const destination = this.createEntry(
      destinationHref,
      options.state,
      isSameDocumentFragmentNavigation(this.currentEntry.url, destinationHref)
    );
    let nextEntries: StoredEntry[];
    let nextIndex: number;

    if (history === 'replace') {
      nextEntries = [...this.entriesValue];
      nextEntries[this.indexValue] = destination;
      nextIndex = this.indexValue;
    } else {
      nextEntries = this.entriesValue.slice(0, this.indexValue + 1);
      nextEntries.push(destination);
      nextIndex = nextEntries.length - 1;
    }

    return this.commitNavigation(
      destination,
      history,
      options.info,
      nextEntries,
      nextIndex,
      context
    );
  }

  reload(options: NavigationReloadOptions = {}): NavigationResultLike {
    const current = this.entriesValue[this.indexValue];
    const state = Object.prototype.hasOwnProperty.call(options, 'state')
      ? options.state
      : current.state;
    const entry = this.createEntry(current.url, state, false);
    const nextEntries = [...this.entriesValue];
    nextEntries[this.indexValue] = entry;
    return this.commitNavigation(entry, 'reload', options.info, nextEntries, this.indexValue);
  }

  traverseTo(key: string, options: NavigationOptions = {}): NavigationResultLike {
    const destinationIndex = this.entriesValue.findIndex(entry => entry.key === key);
    if (destinationIndex < 0) {
      throw new DOMException(`No navigation entry has key "${key}".`, 'InvalidStateError');
    }

    const destination = this.entriesValue[destinationIndex];
    return this.commitNavigation(
      destination,
      'traverse',
      options.info,
      this.entriesValue,
      destinationIndex
    );
  }

  back(options: NavigationOptions = {}): NavigationResultLike {
    if (!this.canGoBack) {
      throw new DOMException('There is no previous navigation entry.', 'InvalidStateError');
    }
    return this.traverseTo(this.entriesValue[this.indexValue - 1].key, options);
  }

  forward(options: NavigationOptions = {}): NavigationResultLike {
    if (!this.canGoForward) {
      throw new DOMException('There is no next navigation entry.', 'InvalidStateError');
    }
    return this.traverseTo(this.entriesValue[this.indexValue + 1].key, options);
  }

  updateCurrentEntry(options: { state: unknown }): void {
    const from = this.currentEntryValue;
    this.entriesValue[this.indexValue].state = options.state;
    this.currentEntryValue.setState(options.state);
    this.persist();
    this.dispatchEvent(new NavigationFacadeCurrentEntryChangeEvent(null, from));
  }

  private commitNavigation(
    target: StoredEntry,
    type: NavigationType,
    info: unknown,
    nextEntries: StoredEntry[],
    nextIndex: number,
    context: NavigateContext = {
      userInitiated: false,
      formData: null,
      sourceElement: null,
    }
  ): NavigationResultLike {
    const from = this.currentEntryValue;
    const destination = this.toEntry(target, nextIndex);

    const controller = new AbortController();
    let resolveFinished!: (entry: NavigationEntryLike) => void;
    let rejectFinished!: (error: unknown) => void;
    const finished = new Promise<NavigationEntryLike>((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
    const transitionFinished = finished.then(() => undefined);
    void transitionFinished.catch(() => undefined);
    this.transitionType = type;
    const transitionValue = { from, finished: transitionFinished };
    this.transitionValue = transitionValue;

    const event = new NavigationFacadeNavigateEvent(
      type,
      destination,
      from,
      controller.signal,
      info,
      context
    );
    const accepted = this.dispatchEvent(event);
    event.finishDispatch();
    if (!accepted) {
      controller.abort();
      const error = new DOMException('Navigation was canceled.', 'AbortError');
      rejectFinished(error);
      const committed = Promise.reject(error);
      void committed.catch(() => undefined);
      void finished.catch(() => undefined);
      this.dispatchEvent(new NavigationFacadeNavigateErrorEvent(error));
      this.transitionValue = null;
      return {
        committed,
        finished,
      };
    }

    this.entriesValue = nextEntries;
    this.indexValue = nextIndex;
    this.currentEntryValue = destination;
    this.persist();
    this.dispatchEvent(new NavigationFacadeCurrentEntryChangeEvent(type, from));
    const committed = Promise.resolve(destination);
    const handler = event.getInterceptHandler();

    void Promise.resolve().then(async () => {
      try {
        await handler?.();
        this.dispatchEvent(new Event('navigatesuccess'));
        resolveFinished(destination);
      } catch (error) {
        controller.abort();
        this.dispatchEvent(new NavigationFacadeNavigateErrorEvent(error));
        rejectFinished(error);
      } finally {
        if (this.transitionValue === transitionValue) {
          this.transitionValue = null;
        }
      }
    });

    return { committed, finished };
  }

  private handleDocumentClick(event: MouseEvent): void {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || link.relList.contains('external')) {
      return;
    }

    if (!this.targetsCurrentContext(link.getAttribute('target'))) {
      return;
    }

    const destination = this.getSameOriginUrl(link.getAttribute('href') ?? '');
    if (!destination) {
      return;
    }

    this.navigateInternal(destination.href, {}, {
      userInitiated: event.isTrusted,
      formData: null,
      sourceElement: link,
    });
    event.preventDefault();
  }

  private handleFormSubmit(event: SubmitEvent): void {
    if (event.defaultPrevented || !(event.target instanceof HTMLFormElement)) {
      return;
    }

    if (this.interceptFormSubmission(event.target, event.submitter, event.isTrusted, false)) {
      event.preventDefault();
    }
  }

  private interceptFormSubmission(
    form: HTMLFormElement,
    submitter: HTMLElement | null,
    userInitiated: boolean,
    replace: boolean
  ): boolean {
    if (form.getAttribute('rel')?.split(/\s+/).includes('external')) {
      return false;
    }

    const submitControl = submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement
      ? submitter
      : undefined;
    const target = submitControl?.formTarget || form.getAttribute('target');
    const method = (submitControl?.formMethod || form.method).toLowerCase();
    if (!this.targetsCurrentContext(target) || method === 'dialog') {
      return false;
    }

    const formAction = form.getAttribute('action') || this.currentEntry.url;
    const action = submitControl?.hasAttribute('formaction')
      ? submitControl.getAttribute('formaction') || this.currentEntry.url
      : formAction;
    const destination = this.getSameOriginUrl(action);
    if (!destination) {
      return false;
    }

    const formData = new FormData(form);
    if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
      if (submitter.type === 'image') {
        return false;
      }
      if (submitter.name && !submitter.disabled) {
        formData.append(submitter.name, submitter.value);
      }
    }

    if (method === 'get') {
      destination.search = '';
      for (const [name, value] of formData) {
        destination.searchParams.append(name, typeof value === 'string' ? value : value.name);
      }
    }

    this.navigateInternal(destination.href, { history: replace ? 'replace' : 'push' }, {
      userInitiated,
      formData: method === 'post' ? formData : null,
      sourceElement: submitter ?? form,
      preserveEmptyQuery: method === 'get' && formData.entries().next().done,
    });
    return true;
  }

  private targetsCurrentContext(target: string | null): boolean {
    const effectiveTarget = target
      || this.navigationDocument?.querySelector('base[target]')?.getAttribute('target')
      || '';
    return !effectiveTarget || effectiveTarget.toLowerCase() === '_self';
  }

  private getSameOriginUrl(url: string): URL | undefined {
    try {
      const base = this.navigationDocument?.querySelector('base[href]') as HTMLBaseElement | null;
      const destination = new URL(url, base?.href || this.currentEntry.url);
      return destination.origin === new URL(this.currentEntry.url).origin
        ? destination
        : undefined;
    } catch {
      return undefined;
    }
  }

  private resolveUrl(url: string): URL {
    const resolved = new URL(url, this.currentEntry.url);
    if (resolved.origin !== new URL(this.currentEntry.url).origin) {
      throw new DOMException('The navigation facade only supports same-origin URLs.', 'SecurityError');
    }
    return resolved;
  }

  private createEntry(
    url: string,
    state: unknown = null,
    sameDocument = true
  ): StoredEntry {
    return { key: createId(), id: createId(), url, state, sameDocument };
  }

  private toEntry(entry: StoredEntry, index: number): NavigationFacadeEntry {
    const cached = this.entryCache.get(entry.id);
    if (cached) {
      return cached;
    }

    const navigationEntry = new NavigationFacadeEntry(entry, index);
    this.entryCache.set(entry.id, navigationEntry);
    return navigationEntry;
  }

  private getHandler<E extends Event>(
    type: string
  ): ((this: NavigationApiLike, event: E) => unknown) | null {
    return (this.eventHandlers.get(type)?.handler as
      | ((this: NavigationApiLike, event: E) => unknown)
      | undefined) ?? null;
  }

  private setHandler<E extends Event>(
    type: string,
    handler: ((this: NavigationApiLike, event: E) => unknown) | null
  ): void {
    const previous = this.eventHandlers.get(type);
    if (previous) {
      this.removeEventListener(type, previous.listener);
    }
    if (handler) {
      const listener: EventListener = event => handler.call(this, event as E);
      this.eventHandlers.set(type, { handler, listener });
      this.addEventListener(type, listener);
    } else {
      this.eventHandlers.delete(type);
    }
  }

  private readStoredNavigation(initialUrl: URL): StoredNavigation | undefined {
    const serialized = this.storage?.getItem(this.storageKey);
    if (!serialized) {
      return undefined;
    }

    const value: unknown = JSON.parse(serialized);
    if (!isStoredNavigation(value)) {
      throw new TypeError('Stored navigation data has an unsupported or invalid format.');
    }

    const origin = initialUrl.origin;
    if (value.entries.some(entry => new URL(entry.url).origin !== origin)) {
      return undefined;
    }
    return value;
  }

  private persist(): void {
    const record: StoredNavigation = {
      version: 1,
      entries: this.entriesValue,
      index: this.indexValue,
    };
    this.storage?.setItem(this.storageKey, JSON.stringify(record));
  }
}

export function createNavigationFacade(
  options: NavigationFacadeOptions = {}
): NavigationFacade {
  return new NavigationFacade(options);
}

function isStoredNavigation(value: unknown): value is StoredNavigation {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<StoredNavigation>;
  return candidate.version === 1
    && Array.isArray(candidate.entries)
    && candidate.entries.length > 0
    && Number.isInteger(candidate.index)
    && candidate.index! >= 0
    && candidate.index! < candidate.entries.length
    && candidate.entries.every(entry =>
      !!entry
      && typeof entry.key === 'string'
      && typeof entry.id === 'string'
      && typeof entry.url === 'string'
      && (entry.sameDocument === undefined || typeof entry.sameDocument === 'boolean')
    );
}

function createId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function isSameDocumentFragmentNavigation(fromUrl: string, destinationUrl: string): boolean {
  const from = new URL(fromUrl);
  const destination = new URL(destinationUrl);
  return from.origin === destination.origin
    && from.pathname === destination.pathname
    && from.search === destination.search
    && from.hash !== destination.hash;
}

function appendEmptyQueryDelimiter(url: string): string {
  const hashIndex = url.indexOf('#');
  if (hashIndex < 0) {
    return url.endsWith('?') ? url : `${url}?`;
  }

  const beforeHash = url.slice(0, hashIndex);
  return beforeHash.endsWith('?')
    ? url
    : `${beforeHash}?${url.slice(hashIndex)}`;
}
