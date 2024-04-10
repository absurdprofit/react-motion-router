import {
    NavigationBase,
    RouterData,
} from '@react-motion-router/core';
import { GoBackOptions, GoForwardOptions, NavigateOptions, NavigationProps } from './common/types';
import { BackEvent, ForwardEvent, NavigateEvent } from './common/events';
import { HistoryEntry } from './HistoryEntry';
import { Router } from './Router';

export class Navigation extends NavigationBase {
    declare protected readonly routerData: RouterData<Router, Navigation>;
    private isInternalBack = false;
    private _finished: Promise<void> = new Promise(() => { });
    private _currentIndex = 0;

    onPopState = (e: Event) => {
        e.preventDefault();
        if (this.isInternalBack) {
            this.isInternalBack = false;
            return;
        }

        // const pathname = window.location.pathname.replace(this.history.baseURL.pathname, '') || '/';
        // if (pathname === this.history.previous) {
        //     this.implicitBack();
        // } else {
        //     this.implicitNavigate(pathname);
        // }
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
        const transition = window.navigation.navigate(url.href, { history, state: { params, config } })

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        
        const event = this.createNavigateEvent(route, props, history, controller);
        this.dispatchEvent?.(event);

        return transition;
    }

    goBack(options: GoBackOptions = {}) {
        if (this.canGoBack) return;

        const previous = this.previous!;
        const transition = window.navigation.traverseTo(previous.key);

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        
        const event = this.createBackEvent(controller);
        this.dispatchEvent?.(event);

        return transition;
    }

    goForward(options: GoForwardOptions = {}) {
        if (this.canGoForward) return;

        const next = this.next!;
        const transition = window.navigation.traverseTo(next.key);

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        
        const event = this.createForwardEvent(controller);
        this.dispatchEvent?.(event);

        return transition;
    }

    private createBackEvent(controller: AbortController) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new BackEvent(this.routerId, controller.signal, this._finished);
    }

    private createForwardEvent(controller: AbortController) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new ForwardEvent(this.routerId, controller.signal, this._finished);
    }

    private createNavigateEvent(
        route: string,
        props: NavigationProps,
        type: NavigateOptions["type"],
        controller: AbortController
    ) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new NavigateEvent(this.routerId, route, props, type, controller.signal, this._finished);
    }

    private onNavigateAbort() {
        // this._animationLayerData.cancel();
        this.goBack();
    }

    private onBackAbort() {
        // this._animationLayerData.cancel();
        this.goForward();
    }

    get transition() {
        return this.routerData.routerInstance.state.transition ?? null;
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