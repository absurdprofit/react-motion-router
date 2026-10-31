export interface NavigationEntryLike {
  readonly key: string;
  readonly id: string;
  readonly url: string | null;
  readonly index: number;
  readonly sameDocument: boolean;
  getState(): unknown;
}

export interface NavigationResultLike {
  readonly committed: Promise<NavigationEntryLike>;
  readonly finished: Promise<NavigationEntryLike>;
}

export interface NavigationTransitionLike {
  readonly navigationType: 'push' | 'replace' | 'traverse' | 'reload';
  readonly from: NavigationEntryLike;
  readonly finished: Promise<void>;
}

export interface NavigationDestinationLike {
  readonly url: string;
  readonly key: string | null;
  readonly id: string | null;
  readonly index: number;
  readonly sameDocument: boolean;
  getState(): unknown;
}

export interface NavigationNavigateEventLike extends Event {
  readonly navigationType: 'push' | 'replace' | 'traverse' | 'reload';
  readonly destination: NavigationDestinationLike;
  readonly signal: AbortSignal;
  readonly info: unknown;
  readonly canIntercept: boolean;
  readonly userInitiated: boolean;
  readonly hashChange: boolean;
  readonly hasUAVisualTransition: boolean;
  readonly formData: FormData | null;
  readonly downloadRequest: string | null;
  readonly sourceElement: Element | null;
  intercept(options?: { handler?: () => void | Promise<void> }): void;
}

export interface NavigationCurrentEntryChangeEventLike extends Event {
  readonly navigationType: 'push' | 'replace' | 'traverse' | 'reload' | null;
  readonly from: NavigationEntryLike;
}

export interface NavigationNavigateErrorEventLike extends Event {
  readonly error: unknown;
  readonly message: string;
}

export interface NavigationApiLike extends EventTarget {
  readonly currentEntry: NavigationEntryLike | null;
  readonly transition?: NavigationTransitionLike | null;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  onnavigate?: ((this: NavigationApiLike, event: NavigationNavigateEventLike) => unknown) | null;
  onnavigatesuccess?: ((this: NavigationApiLike, event: Event) => unknown) | null;
  onnavigateerror?: ((this: NavigationApiLike, event: NavigationNavigateErrorEventLike) => unknown) | null;
  oncurrententrychange?: ((this: NavigationApiLike, event: NavigationCurrentEntryChangeEventLike) => unknown) | null;
  entries(): NavigationEntryLike[];
  navigate(url: string, options?: NavigationNavigateOptions): NavigationResultLike;
  reload(options?: NavigationReloadOptions): NavigationResultLike;
  traverseTo(key: string, options?: NavigationOptions): NavigationResultLike;
  back(options?: NavigationOptions): NavigationResultLike;
  forward(options?: NavigationOptions): NavigationResultLike;
  updateCurrentEntry(options: { state: unknown }): void;
}

export interface NavigationFacadeInstanceLike extends NavigationApiLike {
  dispose(): void;
}

export interface NavigationOptions {
  info?: unknown;
}

export interface NavigationNavigateOptions extends NavigationOptions {
  history?: 'auto' | 'push' | 'replace';
  state?: unknown;
}

export interface NavigationReloadOptions extends NavigationOptions {
  state?: unknown;
}

export interface NavigationFacadeOptions {
  initialUrl?: string | URL;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  storageKey?: string;
}

export function isNavigationSupported(): boolean {
  return typeof window !== 'undefined' && 'navigation' in window && !!window.navigation;
}

let fallbackPromise: Promise<NavigationApiLike> | undefined;

export function getNativeNavigation(): NavigationApiLike | undefined {
  if (!isNavigationSupported()) {
    return undefined;
  }

  return Reflect.get(window, 'navigation') as NavigationApiLike | undefined;
}

export async function getNavigationApi(
  options?: NavigationFacadeOptions
): Promise<NavigationApiLike> {
  const nativeNavigation = getNativeNavigation();
  if (nativeNavigation) {
    return nativeNavigation;
  }

  if (options) {
    const { createNavigationFacade } = await import('./polyfill');
    return createNavigationFacade(options);
  }

  const promise = fallbackPromise ?? import('./polyfill').then(({ createNavigationFacade }) =>
    createNavigationFacade()
  );
  fallbackPromise = promise;
  return promise;
}

export async function createNavigationFacade(
  options?: NavigationFacadeOptions
): Promise<NavigationFacadeInstanceLike> {
  const { createNavigationFacade: create } = await import('./polyfill');
  return create(options);
}
