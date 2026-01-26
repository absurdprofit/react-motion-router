import {
  FIRST_INDEX,
  LAST_INDEX,
  NavigationBase,
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
import { Router } from './Router';

export class Navigation extends NavigationBase<RouterEventMap> {
  protected readonly router: Router;

  constructor(router: Router) {
    super();
    this.router = router;
  }

  public preload(
    route: string,
    props: NavigationProps = {},
    options: NavigationBaseOptions = {}
  ) {
    const { pathname } = new URL(route, this.baseURL);
    return this.router.preload(pathname, props, options);
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
    return this.router.committed;
  }

  public get transition() {
    return this.router.state.transition;
  }

  public get globalEntries() {
    return window.navigation.entries();
  }

  public get entries() {
    const nestedPathPatterns = this.router
      .pathPatterns
      .filter(({ pattern }) => pattern.endsWith('**'));
    let nestedScopePathPattern: PathPattern | null = null;
    let nestedBoundaryReached = false;
    return this.globalEntries
      .filter(entry => {
        if (!entry.url) return false;
        const url = new URL(entry.url);
        const resolvedBaseURL = resolveBaseURLFromPattern(
          this.baseURLPattern.pathname, url.pathname
        );
        if (!resolvedBaseURL)
          return false;

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
            || nestedBoundaryReached
          ) {
            // contiguous nested router entries found, short circuit
            nestedBoundaryReached = true;
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
        return true;
      })
      .map((entry, index) => {
        return new HistoryEntry(entry, this.routerId, index);
      });
  }

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
    return Boolean(this.previous?.sameDocument);
  }

  public canGoForward(
    this: Navigation
  ): this is Navigation & { next: HistoryEntry } {
    return Boolean(this.next?.sameDocument);
  }
}