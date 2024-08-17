import {
    NavigationBase,
    includesRoute,
    resolveBaseURLFromPattern,
} from '@react-motion-router/core';
import { GoBackOptions, GoForwardOptions, NavigateOptions, NavigationBaseOptions, NavigationProps, RouterEventMap } from './common/types';
import { BackEvent, ForwardEvent, NavigateEvent } from './common/events';
import { HistoryEntry } from './HistoryEntry';
import { Router } from './Router';



export class Navigation extends NavigationBase<RouterEventMap> {
    protected readonly router: Router;

    constructor(router: Router) {
        super();
        this.router = router;
    }

    replace(route: string, props: NavigationProps = {}, options: NavigationBaseOptions = {}) {
        return this.navigate(route, props, { ...options, type: "replace" });
    }

    push(route: string, props: NavigationProps = {}, options: NavigationBaseOptions = {}) {
        return this.navigate(route, props, { ...options, type: "push" });
    }

    reload(props: NavigationProps = {}) {
        return window.navigation.reload({ state: props });
    }

    traverseTo(key: string, options: NavigationBaseOptions = {}) {
        const result = window.navigation.traverseTo(key);
        const transition = window.navigation.transition!;

        const fromIndex = transition.from.index;
        const destinationIndex = window.navigation.entries().findIndex(entry => entry.key === key);

        const controller = new AbortController();
        controller.signal.addEventListener('abort', () => this.traverseTo(transition.from.key), { once: true });
        options.signal?.addEventListener('abort', controller.abort, { once: true });

        let event;
        if (fromIndex > destinationIndex) {
            event = this.createBackEvent(controller.signal, result.committed, transition);
        } else {
            event = this.createForwardEvent(controller.signal, result.committed, transition);
        }
        this.dispatchEvent?.(event);

        return result;
    }

    navigate(
        route: string,
        props: NavigationProps = {},
        options: NavigateOptions = {}
    ) {
        const { type: history = "push" } = options;

        const url = new URL(route, this.baseURL);
        const result = window.navigation.navigate(url.href, { history, state: props });
        const transition = window.navigation.transition!;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', () => this.goBack(), { once: true });
        options.signal?.addEventListener('abort', controller.abort, { once: true });

        const event = this.createNavigateEvent(route, props, history, controller.signal, result.committed, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    goBack(options: GoBackOptions = {}) {
        if (!this.canGoBack) return;

        const previous = this.previous!;
        const result = window.navigation.traverseTo(previous.key);
        const transition = window.navigation.transition!;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', () => this.goForward(), { once: true });
        options.signal?.addEventListener('abort', controller.abort, { once: true });

        const event = this.createBackEvent(controller.signal, result.committed, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    goForward(options: GoForwardOptions = {}) {
        if (!this.canGoForward) return;

        const next = this.next!;
        const result = window.navigation.traverseTo(next.key);
        const transition = window.navigation.transition!;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', () => this.goBack(), { once: true });
        options.signal?.addEventListener('abort', controller.abort, { once: true });

        const event = this.createForwardEvent(controller.signal, result.committed, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    private createBackEvent(
        signal: AbortSignal,
        committed: Promise<NavigationHistoryEntry>,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new BackEvent(this.routerId, signal, committed, transition);
    }

    private createForwardEvent(
        signal: AbortSignal,
        committed: Promise<NavigationHistoryEntry>,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new ForwardEvent(this.routerId, signal, committed, transition);
    }

    private createNavigateEvent(
        route: string,
        props: NavigationProps,
        type: NavigateOptions["type"],
        signal: AbortSignal,
        committed: Promise<NavigationHistoryEntry>,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
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

    get committed() {
        return this.router.committed;
    }

    get transition() {
        return this.router.state.transition;
    }

    get globalEntries() {
        return window.navigation.entries();
    }

    get entries() {
        const nestedPathPatterns = this.router.pathPatterns.filter(({ pattern }) => pattern.endsWith("**"));
        let inNestedScope = false;
        return this.globalEntries
            .filter(entry => {
                if (!entry.url) return false;
                const url = new URL(entry.url);
                if (!resolveBaseURLFromPattern(this.baseURLPattern.pathname, url.pathname))
                    return false;

                if (includesRoute(nestedPathPatterns, url.pathname, this.baseURLPattern.pathname)) {
                    if (inNestedScope)
                        return false;

                    return inNestedScope = true; // technically in nested scope but include the first entry (the entry intercepted by the parent router)
                } else {
                    inNestedScope = false;
                    return true; // not in nested scope, so include
                }
            })
            .map((entry, index) => {
                return new HistoryEntry(entry, this.routerId, index);
            });
    }

    get index() {
        const globalCurrentIndex = window.navigation.currentEntry?.index ?? -1;
        const firstEntryGlobalIndex = this.entries.at(0)?.globalIndex ?? -1;
        const lastEntryGlobalIndex = this.entries.at(-1)?.globalIndex ?? -1;
        if (globalCurrentIndex <= firstEntryGlobalIndex)
            return 0;
        else if (globalCurrentIndex >= lastEntryGlobalIndex)
            return this.entries.length - 1;
        else {
            const scopedEntries = this.globalEntries.slice(firstEntryGlobalIndex, globalCurrentIndex + 1);
            return this.entries.findLastIndex(entry => {
                return scopedEntries.findLastIndex(globalEntry => entry.key === globalEntry.key) > -1;
            });
        }
    }

    get previous(): HistoryEntry | null {
        return this.entries[this.index - 1] ?? null;
    }

    get next(): HistoryEntry | null {
        return this.entries[this.index + 1] ?? null;
    }

    get current() {
        return this.entries[this.index];
    }

    get canGoBack() {
        return Boolean(this.previous?.sameDocument);
    }

    get canGoForward() {
        return Boolean(this.next?.sameDocument);
    }
}