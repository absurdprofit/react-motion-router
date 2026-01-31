import {
  FIRST_INDEX,
  LAST_INDEX,
  LoadNavigationTransition,
  NavigationBase,
  NavigationBaseConfig,
  PathPattern,
  SINGLE_ELEMENT_LENGTH,
  matchRoute,
  resolveBaseURLFromPattern
} from '@react-motion-router/core';
import {
  GoBackOptions,
  GoForwardOptions,
  NavigateOptions,
  NavigationBaseOptions,
  NavigationProps,
  RouterEventMap
} from './common/types';
import { BackEvent, ForwardEvent, NavigateEvent } from './common/events';
import { HistoryEntry } from './HistoryEntry';

export interface NavigationConfig extends NavigationBaseConfig<
  RouterEventMap
> {
  preload(
    pathname: string,
    props?: NavigationProps,
    options?: NavigationBaseOptions
  ): Promise<boolean>;
  getCommitted(): Promise<NavigationHistoryEntry> | null;
  getTransition(): NavigationTransition | LoadNavigationTransition | null;
  getPathPatterns(): PathPattern[];
}

export class Navigation extends NavigationBase<RouterEventMap> {
  private readonly config;

  constructor(config: NavigationConfig) {
    super(config);
    this.config = config;
  }

  public preload(
    route: string,
    props: NavigationProps = {},
    options: NavigationBaseOptions = {}
  ) {
    const { pathname } = new URL(route, this.baseURL);
    return this.config.preload(pathname, props, options);
  }

  public replace(
    route: string,
    props: NavigationProps = {},
    options: NavigationBaseOptions = {}
  ) {
    return this.navigate(route, props, { ...options, type: 'replace' });
  }

  public push(
    route: string,
    props: NavigationProps = {},
    options: NavigationBaseOptions = {}
  ) {
    return this.navigate(route, props, { ...options, type: 'push' });
  }

  public reload(props: NavigationProps = {}) {
    return window.navigation.reload({ state: props });
  }

  public traverseTo(key: string, options: NavigationBaseOptions = {}) {
    const result = window.navigation.traverseTo(key);
    const transition = window.navigation.transition!;

    const fromIndex = transition.from.index;
    const destinationIndex = window.navigation
      .entries()
      .findIndex(entry => entry.key === key);

    const controller = new AbortController();
    controller.signal
      .addEventListener(
        'abort',
        () => this.traverseTo(transition.from.key), { once: true }
      );
    options.signal?.addEventListener('abort', controller.abort, { once: true });

    let event;
    if (fromIndex > destinationIndex) {
      event = this.createBackEvent(
        controller.signal,
        result.committed,
        transition
      );
    } else {
      event = this.createForwardEvent(
        controller.signal,
        result.committed,
        transition
      );
    }
    this.dispatchEvent?.(event);

    return result;
  }

  public navigate(
    route: string,
    props: NavigationProps = {},
    options: NavigateOptions = {}
  ) {
    const { type: history = 'push' } = options;

    const url = new URL(route, this.baseURL);
    const result = window.navigation
      .navigate(url.href, { history, state: props });
    const transition = window.navigation.transition!;

    const controller = new AbortController();
    controller.signal
      .addEventListener('abort', () => this.goBack(), { once: true });
    options.signal?.addEventListener('abort', controller.abort, { once: true });

    const event = this.createNavigateEvent(
      route,
      props,
      history,
      controller.signal,
      result.committed,
      transition
    );
    this.dispatchEvent?.(event);

    return result;
  }

  public goBack(options: GoBackOptions = {}) {
    if (!this.canGoBack()) return;

    const result = window.navigation.traverseTo(this.previous.key);
    const transition = window.navigation.transition!;

    const controller = new AbortController();
    controller.signal
      .addEventListener('abort', () => this.goForward(), { once: true });
    options.signal?.addEventListener('abort', controller.abort, { once: true });

    const event = this.createBackEvent(
      controller.signal,
      result.committed,
      transition
    );
    this.dispatchEvent?.(event);

    return result;
  }

  public goForward(options: GoForwardOptions = {}) {
    if (!this.canGoForward()) return;

    const result = window.navigation.traverseTo(this.next.key);
    const transition = window.navigation.transition!;

    const controller = new AbortController();
    controller.signal
      .addEventListener('abort', () => this.goBack(), { once: true });
    options.signal?.addEventListener('abort', controller.abort, { once: true });

    const event = this.createForwardEvent(
      controller.signal,
      result.committed,
      transition
    );
    this.dispatchEvent?.(event);

    return result;
  }

  private createBackEvent(
    signal: AbortSignal,
    committed: Promise<NavigationHistoryEntry>,
    transition: NavigationTransition
  ) {
    if (!this.routerId) throw new Error('Router ID is not set');
    return new BackEvent(this.routerId, signal, committed, transition);
  }

  private createForwardEvent(
    signal: AbortSignal,
    committed: Promise<NavigationHistoryEntry>,
    transition: NavigationTransition
  ) {
    if (!this.routerId) throw new Error('Router ID is not set');
    return new ForwardEvent(this.routerId, signal, committed, transition);
  }

  private createNavigateEvent(
    route: string,
    props: NavigationProps,
    type: NavigateOptions['type'],
    signal: AbortSignal,
    committed: Promise<NavigationHistoryEntry>,
    transition: NavigationTransition
  ) {
    if (!this.routerId) throw new Error('Router ID is not set');
    return new NavigateEvent(
      this.routerId,
      route,
      props,
      type,
      signal,
      committed,
      transition
    );
  }

  public get committed() {
    return this.config.getCommitted();
  }

  public get transition() {
    return this.config.getTransition();
  }

  public get globalEntries() {
    return window.navigation.entries();
  }

  // TODO: enforce contiguity for entries owned by other non-nested routers.
  // In the case that we have routers on separate screens we don't want nested screens to see entries that come after
  // other nested entries from different routers.
  public get entries() {
    const nestedPathPatterns = this.config
      .getPathPatterns()
      .filter(({ pattern }) => pattern.endsWith('**'));
    let nestedScopePathPattern: PathPattern | null = null;
    let lastMatchedIndex = LAST_INDEX;
    let terminated = false;
    return this.globalEntries
      .filter((entry, index) => {
        if (!entry.url) return false;
        if (terminated) return false;
        const url = new URL(entry.url);
        const resolvedBaseURL = resolveBaseURLFromPattern(
          this.baseURLPattern.pathname, url.pathname
        );
        if (!resolvedBaseURL) {
          if (lastMatchedIndex !== LAST_INDEX)
            terminated = true;
          return false;
        }

        if (nestedScopePathPattern) {
          // we're in a nested scope, check if the current URL is also apart of the same scope and exit.
          const nestedBaseURLPattern = new URLPattern(
            nestedScopePathPattern.pattern,
            resolvedBaseURL.href
          );
          if (
            matchRoute(
              url.pathname,
              url.pathname,
              nestedBaseURLPattern.pathname,
              nestedScopePathPattern.caseSensitive
            )
          ) {
            return false;
          }
        }

        nestedScopePathPattern = nestedPathPatterns.find(
          ({ pattern, caseSensitive }) => (
            matchRoute(
              pattern,
              url.pathname,
              this.baseURLPattern.pathname,
              caseSensitive
            )
          )
        ) ?? null;

        lastMatchedIndex = index;
        return true;
      })
      .map((entry, index) => {
        return new HistoryEntry(entry, this.routerId, index);
      });
  }

  /**
   * Returns the **local history index** for this router, derived from the
   * browser’s global navigation state.
   *
   * ---
   *
   * ### Problem this solves
   *
   * The Web Navigation API exposes a **single, flat history list**.
   * This router exposes a **scoped history view** that:
   *
   * - filters out entries owned by nested routers
   * - preserves global ordering
   * - reindexes entries locally
   *
   * As a result, there is **no arithmetic relationship** between:
   *
   * - `window.navigation.currentEntry.index` (global)
   * - this router’s local `index`
   *
   * This getter computes the local index **by identity**, not position.
   *
   * ---
   *
   * ### High-level behavior
   *
   * The returned index is:
   *
   * > the index of the **most recent local entry** that appears in the
   * > browser’s global history **at or before** the current global entry.
   *
   * ---
   *
   * ### Resolution strategy
   *
   * 1. If the current global index is **before** this router’s first entry,
   *    the index resolves to `0`.
   *
   * 2. If the current global index is **after** this router’s last entry,
   *    the index resolves to `entries.length - 1`.
   *
   * 3. Otherwise:
   *    - A window of global history is sliced from the first local entry
   *      up to and including the current global entry.
   *    - Local entries are scanned **from newest to oldest**.
   *    - The first local entry whose `key` appears in that global slice
   *      determines the local index.
   *
   * Entry identity is determined by **history entry keys**, not URLs or
   * global indices.
   *
   * ---
   *
   * ### Why key-based matching is required
   *
   * - Global indices are sparse once nested routers are involved
   * - URLs may repeat or be replaced
   * - History entries can be inserted between parent entries
   *
   * Keys provide the only stable identity that survives these cases.
   *
   * ---
   *
   * ### Invariant
   *
   * The returned index always satisfies:
   *
   * ```
   * 0 ≤ index < entries.length
   * ```
   *
   * and monotonically tracks navigation through global history.
   *
   * ---
   *
   * ### Example
   *
   * Global history:
   * ```
   * 0: /
   * 1: /world
   * 2: /world/1   (nested)
   * 3: /about     ← current
   * ```
   *
   * Local router entries:
   * ```
   * /        (index 0)
   * /world   (index 1)
   * /about   (index 2)
   * ```
   *
   * Result:
   * ```
   * index === 2
   * ```
   */
  public get index() {
    const globalCurrentIndex = window.navigation
      .currentEntry
      ?.index ?? LAST_INDEX;
    const firstEntryGlobalIndex = this.entries
      .at(FIRST_INDEX)
      ?.globalIndex ?? LAST_INDEX;
    const lastEntryGlobalIndex = this.entries
      .at(LAST_INDEX)
      ?.globalIndex ?? LAST_INDEX;
    if (globalCurrentIndex <= firstEntryGlobalIndex)
      return FIRST_INDEX;
    else if (globalCurrentIndex >= lastEntryGlobalIndex)
      return this.entries.length - SINGLE_ELEMENT_LENGTH;
    else {
      const scopedEntries = this.globalEntries
        .slice(
          firstEntryGlobalIndex,
          globalCurrentIndex + SINGLE_ELEMENT_LENGTH
        );
      return this.entries.findLastIndex(entry => {
        return scopedEntries
          .findLastIndex(
            globalEntry => entry.key === globalEntry.key
          ) > LAST_INDEX;
      });
    }
  }

  public get previous(): HistoryEntry | null {
    return this.entries[this.index - SINGLE_ELEMENT_LENGTH] ?? null;
  }

  public get next(): HistoryEntry | null {
    return this.entries[this.index + SINGLE_ELEMENT_LENGTH] ?? null;
  }

  public get current() {
    return this.entries[this.index];
  }

  public canGoBack(
    this: Navigation
  ): this is Navigation & { previous: HistoryEntry } {
    return Boolean(this.previous?.url?.origin === globalThis.location.origin);
  }

  public canGoForward(
    this: Navigation
  ): this is Navigation & { next: HistoryEntry } {
    return Boolean(this.next?.url?.origin === globalThis.location.origin);
  }
}