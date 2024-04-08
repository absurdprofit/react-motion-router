import {
    NavigationBase,
    RouterData,
    searchParamsFromObject
} from '@react-motion-router/core';
import { GoBackOptions, NavigateOptions, NavigationProps } from './common/types';
import { BackEvent, NavigateEvent } from './common/events';

export class Navigation extends NavigationBase {
    private isInternalBack = false;
    private _finished: Promise<void> = new Promise(() => { });
    private _currentIndex = 0;

    constructor(
        _routerData: RouterData<Navigation>,
        _disableBrowserRouting: boolean = false,
    ) {
        super(_routerData, _disableBrowserRouting);
    }

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
        window.navigation.traverseTo(key);
    }

    navigate(
        route: string,
        props: NavigationProps = {},
        options: NavigateOptions = {}
    ) {
        const { type = "push", hash } = options;
        const search = searchParamsFromObject(props?.params || {}, this.paramsSerializer || null);

        if (this.disableBrowserRouting) {
            // if browser routing is disabled, we need to handle history manually
        } else {
            if (!this.baseURL) throw new Error("Base URL is not set");
            const url = new URL(route, this.baseURL);
            url.search = search;
            url.hash = hash ?? '';
            window.navigation.navigate(url.href, { history: type, state: { ...props.params, routerId: this.routerId } })
        }

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        this._finished = this.createFinishedPromise(controller);
        const event = this.createNavigateEvent(route, props, type, controller);

        if (this.dispatchEvent) this.dispatchEvent(event);

        return this._finished;
    }

    private implicitNavigate(route: string, props: NavigationProps = {}) {
        // this._history.implicitPush(route);

        const controller = new AbortController();
        this._finished = this.createFinishedPromise(controller);
        // const event = this.createNavigateEvent(route, props, false, controller);

        // if (this.dispatchEvent) this.dispatchEvent(event);
        return this._finished;
    }

    private implicitBack() {
        // this._history.implicitBack();

        const controller = new AbortController();
        this._finished = this.createFinishedPromise(controller);
        let event = this.createBackEvent(controller);
        if (this.dispatchEvent) this.dispatchEvent(event);
        return this._finished;
    }

    goBack(options: GoBackOptions = {}) {
        this.isInternalBack = true;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onBackAbort.bind(this), { once: true });
        this._finished = this.createFinishedPromise(controller);
        // if (this._history.length === 1) {
        //     if (this.parent === null) {
        //         // if no history in root router, fallback to browser back
        //         window.history.back();
        //         return;
        //     }
        //     this.parent.goBack();
        // } else {
        //     let event = this.createBackEvent(controller);
        //     if (this._disableBrowserRouting) {
        //         this._history.implicitBack();
        //     } else {
        //         if (this.history.state.get<string>("routerId") !== this.routerId) {
        //             // handle superfluous history entries on call to go back on ancestor navigator
        //             // delta = 1 for current navigator stack entry pop
        //             let delta = 0;
        //             // travel down navigator tree to find all current history entries
        //             let navigator: Navigation | undefined = this;
        //             while (navigator) {
        //                 if (!navigator.disableBrowserRouting) {
        //                     if (navigator === this) {
        //                         delta += 1;
        //                     } else {
        //                         if (navigator.history.length > 1) {
        //                             delta += navigator.history.length;
        //                         }
        //                     }
        //                 }
        //                 navigator = navigator.routerData.childRouterData?.navigation as Navigation;
        //             }
        //             window.history.go(-delta);
        //             // this._history.implicitBack();
        //         } else {
        //             this._history.back();
        //         }
        //     }
        //     if (this.dispatchEvent) this.dispatchEvent(event);
        // } 


        return this._finished;
    }

    goForward() {
        if (!this.canGoForward) return;
        this.traverseTo(this.next!.key);
    }

    private createBackEvent(controller: AbortController) {
        if (!this.routerId) throw new Error("Router ID is not set");
        return new BackEvent(this.routerId, controller.signal, this._finished);
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

    private createFinishedPromise(controller: AbortController) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                // await this._animationLayerData.finished;
                resolve();
            } catch (e) {
                controller.abort(e);
                reject(e);
            }
        });
    }

    private onNavigateAbort() {
        // this._animationLayerData.cancel();
        this.goBack();
    }

    private onBackAbort() {
        // this._animationLayerData.cancel();
        this.goForward();
    }

    get finished() {
        return this._finished;
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

    get committed() {
        return Promise.resolve();
    }
}