import {
    BackEventDetail,
    GoBackOptions,
    NavigateEventDetail,
    NavigateOptions,
    NavigationBase,
    RouterData,
    searchParamsFromObject
} from '@react-motion-router/core';
import type { NavigationProps, PlainObject } from '@react-motion-router/core';
import { ScreenProps } from './Screen';

export class Navigation extends NavigationBase {
    private isInternalBack = false;
    private _finished: Promise<void> = new Promise(() => { });
    private _currentIndex = 0;

    constructor(
        _routerId: string,
        _routerData: RouterData<Navigation>,
        _disableBrowserRouting: boolean = false,
        _baseURL: URL,
        _defaultRoute: URL | null = null
    ) {
        super(_routerId, _routerData, _disableBrowserRouting, _baseURL);
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

    navigate<T extends PlainObject = PlainObject>(
        route: string,
        props: NavigationProps<T, ScreenProps["config"]> = {},
        options: NavigateOptions = {}
    ) {
        const { type = "push", hash } = options;
        const search = searchParamsFromObject(props?.params || {}, this.paramsSerializer || null);

        if (this._disableBrowserRouting) {
            // if browser routing is disabled, we need to handle history manually
        } else {
            const url = new URL(route, this.baseURL);
            url.search = search;
            url.hash = hash ?? '';
            window.navigation.navigate(url.href, { history: type, state: { ...props.params } })
        }

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        options.signal?.addEventListener('abort', this.onNavigateAbort.bind(this), { once: true });
        this._finished = this.createFinishedPromise(controller);
        const event = this.createNavigateEvent(route, props, type, controller);

        if (this.dispatchEvent) this.dispatchEvent(event);
        this._currentParams = props?.params || {};

        return this._finished;
    }

    private implicitNavigate(route: string, props: NavigationProps = {}) {
        // this._history.implicitPush(route);

        const controller = new AbortController();
        this._finished = this.createFinishedPromise(controller);
        // const event = this.createNavigateEvent(route, props, false, controller);

        // if (this.dispatchEvent) this.dispatchEvent(event);
        this._currentParams = props?.params || {};
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
        return new CustomEvent<BackEventDetail>('go-back', {
            bubbles: true,
            detail: {
                routerId: this.routerId,
                signal: controller.signal,
                finished: this._finished
            }
        });
    }

    private createNavigateEvent(
        route: string,
        props: NavigationProps<PlainObject, ScreenProps["config"]>,
        type: NavigateOptions["type"],
        controller: AbortController
    ) {
        return new CustomEvent<NavigateEventDetail>('navigate', {
            bubbles: true,
            detail: {
                routerId: this.routerId,
                route,
                props: {
                    params: props.params,
                    config: props.config
                },
                type,
                signal: controller.signal,
                finished: this._finished
            }
        })
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

    get parent() {
        return this.routerData.parentRouterData?.navigation ?? null;
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