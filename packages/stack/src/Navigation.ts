import {
    NavigationBase,
} from '@react-motion-router/core';
import { GoBackOptions, GoForwardOptions, NavigateOptions, NavigationProps } from './common/types';
import { BackEvent, ForwardEvent, NavigateEvent } from './common/events';
import { HistoryEntry } from './HistoryEntry';
import { Router } from './Router';

export class Navigation extends NavigationBase {
    protected readonly router: Router;
    private _currentIndex = 0;

    constructor(router: Router) {
        super(router);
        this.router = router;
    }

    traverseTo(key: string) {
        return window.navigation.traverseTo(key);
    }

    navigate(
        route: string,
        props: NavigationProps = {},
        options: NavigateOptions = {}
    ) {
        const { type: history = "push" } = options;
        const { params, config } = props;

        const url = new URL(route, this.baseURL);
        const result = window.navigation.navigate(url.href, { history, state: { params, config } });
        const transition = window.navigation.transition!;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        
        const event = this.createNavigateEvent(route, props, history, controller, result, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    goBack(options: GoBackOptions = {}) {
        if (this.canGoBack) return;

        const previous = this.previous!;
        const result = window.navigation.traverseTo(previous.key);
        const transition = window.navigation.transition!;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        
        const event = this.createBackEvent(controller, result, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    goForward(options: GoForwardOptions = {}) {
        if (this.canGoForward) return;

        const next = this.next!;
        const result = window.navigation.traverseTo(next.key);
        const transition = window.navigation.transition!;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        
        const event = this.createForwardEvent(controller, result, transition);
        this.dispatchEvent?.(event);

        return result;
    }

    private createBackEvent(
        controller: AbortController,
        result: NavigationResult,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new BackEvent(this.routerId, controller.signal, result, transition);
    }

    private createForwardEvent(
        controller: AbortController,
        result: NavigationResult,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new ForwardEvent(this.routerId, controller.signal, result, transition);
    }

    private createNavigateEvent(
        route: string,
        props: NavigationProps,
        type: NavigateOptions["type"],
        controller: AbortController,
        result: NavigationResult,
        transition: NavigationTransition
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new NavigateEvent(
            this.routerId,
            route,
            props,
            type,
            controller.signal,
            result,
            transition
        );
    }

    private onNavigateAbort() {
        this.goBack();
    }

    private onBackAbort() {
        this.goForward();
    }

    get transition() {
        return this.router.state.transition ?? null;
    }

    get entries() {
        return new Array<HistoryEntry>();
    }

    get previous() {
        return this.entries.at(this._currentIndex - 1) ?? null;
    }

    get next() {
        return this.entries.at(this._currentIndex + 1) ?? null;
    }

    get current() {
        return this.entries.at(this._currentIndex)!;
    }

    get canGoBack() {
        return Boolean(this.previous);
    }

    get canGoForward() {
        return Boolean(this.next);
    }
}