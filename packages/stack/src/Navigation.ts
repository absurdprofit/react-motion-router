import {
    NavigationBase,
    includesRoute,
    resolveBaseURLFromPattern,
} from '@react-motion-router/core';
import { GoBackOptions, GoForwardOptions, NavigateOptions, NavigationBaseOptions, NavigationProps, StackRouterEventMap } from './common/types';
import { BackEvent, ForwardEvent, NavigateEvent } from './common/events';
import { HistoryEntry } from './HistoryEntry';
import { Router } from './Router';

export class Navigation extends NavigationBase<StackRouterEventMap> {
    protected readonly router: Router;

    constructor(router: Router) {
        super(router);
        this.router = router;
    }

    traverseTo(key: string) {
        return window.navigation.traverseTo(key);
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
        
        const event = this.createNavigateEvent(route, props, history, controller.signal, result, transition);
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
        
        const event = this.createBackEvent(controller.signal, result, transition);
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
        
        const event = this.createForwardEvent(controller.signal, result, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    private createBackEvent(
        signal: AbortSignal,
        result: NavigationResult,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new BackEvent(this.routerId, signal, result, transition);
    }

    private createForwardEvent(
        signal: AbortSignal,
        result: NavigationResult,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new ForwardEvent(this.routerId, signal, result, transition);
    }

    private createNavigateEvent(
        route: string,
        props: NavigationProps,
        type: NavigateOptions["type"],
        signal: AbortSignal,
        result: NavigationResult,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new NavigateEvent(
            this.routerId,
            route,
            props,
            type,
            signal,
            result,
            transition
        );
    }

    get transition() {
        return this.router.state.transition;
    }

    get globalEntries() {
        return window.navigation.entries();
    }

    get entries() {
        const nestedPathPatterns = this.router.pathPatterns.filter(pattern => pattern.pattern.endsWith("/**"));
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
                    
                    return inNestedScope = true; // technically in nested scope but include the first entry (the entry rendered by the parent router)
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
        const globalEntries = this.globalEntries;
        const globalCurrentIndex = window.navigation.currentEntry?.index ?? -1;
        const previousEntries = globalEntries.slice(0, globalCurrentIndex + 1);
        return this.entries.findLastIndex(entry => {
            return previousEntries.findLastIndex(globalEntry => entry.source.key === globalEntry.key) > -1;
        });
    }

    get previous() {
        return this.entries[this.index - 1] ?? null;
    }

    get next() {
        return this.entries[this.index + 1] ?? null;
    }

    get current() {
        return this.entries[this.index]!;
    }

    get canGoBack() {
        return Boolean(this.previous);
    }

    get canGoForward() {
        return Boolean(this.next);
    }
}