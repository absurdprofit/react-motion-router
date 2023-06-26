import {
    BackEventDetail,
    concatenateURL,
    GoBackOptions,
    NavigateEventDetail,
    NavigateOptions,
    NavigationBase,
    RouterData,
    searchParamsFromObject
} from '@react-motion-router/core';
import type { AnimationLayerData, PlainObject } from '@react-motion-router/core';
import History from './History';

export default class Navigation extends NavigationBase {
    protected _history: History;
    private _animationLayerData: AnimationLayerData;
    private isInternalBack = false;
    private _finished: Promise<void> = new Promise(() => {});

    constructor(_routerId: string, _routerData: RouterData<Navigation>, _history: History, _animationLayerData: AnimationLayerData, _disableBrowserRouting: boolean = false, _defaultRoute: string | null = null) {
        super(_routerId, _routerData, _disableBrowserRouting, _defaultRoute);

        this._history = _history;
        this._animationLayerData = _animationLayerData;
    }

    onPopState = (e: Event) => {
        e.preventDefault();
        if (this.isInternalBack) {
            this.isInternalBack = false;
            return;
        }

        const pathname = window.location.pathname.replace(this.history.baseURL.pathname, '');
        if (pathname === this.history.previous) {
            this.implicitBack();
        } else {
            this.implicitNavigate(pathname);
        }
    }

    navigate<T extends PlainObject = PlainObject>(
        route: string,
        routeParams?: T,
        options: NavigateOptions = {}
    ) {
        const {replace, hash} = options;
        const search = searchParamsFromObject(routeParams || {}, this.paramsSerializer || null);

        if (this._disableBrowserRouting) {
            this._history.implicitPush(route, Boolean(replace));
        } else {
            this._history.push(route, search, hash || '', Boolean(replace));
        }

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onNavigateAbort.bind(this), {once: true});
        options.signal?.addEventListener('abort', this.onNavigateAbort.bind(this), {once: true});
        this._finished = this.createFinishedPromise(controller);
        const event = this.createNavigateEvent(route, routeParams, Boolean(replace), controller);

        if (this.dispatchEvent) this.dispatchEvent(event);
        this._currentParams = routeParams || {};

        return this._finished;
    }

    private implicitNavigate(route: string, routeParams?: PlainObject) {
        this._history.implicitPush(route);
        
        const controller = new AbortController();
        this._finished = this.createFinishedPromise(controller);
        const event = this.createNavigateEvent(route, routeParams, false, controller);

        if (this.dispatchEvent) this.dispatchEvent(event);
        this._currentParams = routeParams || {};
        return this._finished;
    }

    private implicitBack() {
        this._history.implicitBack();

        const controller = new AbortController();
        this._finished = this.createFinishedPromise(controller);
        let event = this.createBackEvent(false, controller);
        if (this.dispatchEvent) this.dispatchEvent(event);
        return this._finished;
    }

    goBack(options: GoBackOptions = {}) {
        this.isInternalBack = true;
        const {replace} = options;

        const controller = new AbortController();
        controller.signal.addEventListener('abort', this.onBackAbort.bind(this), {once: true});
        options.signal?.addEventListener('abort', this.onBackAbort.bind(this), {once: true});
        this._finished = this.createFinishedPromise(controller);
        if (this._history.length === 1) {
            if (this.parent === null) {
                // if no history in root router, fallback to browser back
                window.history.back();
                return;
            }
            this.parent.goBack();
        } else {
            let event = this.createBackEvent(Boolean(replace), controller);
            if (this._disableBrowserRouting) {
                this._history.implicitBack();
            } else {
                if (this.history.state.get<string>("routerId") !== this.routerId) {
                    // handle superfluous history entries on call to go back on ancestor navigator
                    // delta = 1 for current navigator stack entry pop
                    let delta = 0;
                    // travel down navigator tree to find all current history entries
                    let navigator: Navigation | undefined = this;
                    while (navigator) {
                        if (!navigator.disableBrowserRouting) {
                            if (navigator === this) {
                                delta += 1;
                            } else {
                                if (navigator.history.length > 1) {
                                    delta += navigator.history.length;
                                }
                            }
                        }
                        navigator = navigator.routerData.childRouterData?.navigation as Navigation;
                    }
                    window.history.go(-delta);
                    this._history.implicitBack();
                } else {
                    this._history.back();
                }
            }
            if (this.dispatchEvent) this.dispatchEvent(event);
        } 


        return this._finished;
    }

    private createBackEvent(replace: boolean, controller: AbortController) {
        return new CustomEvent<BackEventDetail>('go-back', {
            bubbles: true,
            detail: {
                routerId: this.routerId,
                replace: replace,
                signal: controller.signal,
                finished: this._finished
            }
        });
    }

    private createNavigateEvent(
        route: string,
        routeParams: PlainObject | undefined,
        replace: boolean,
        controller: AbortController
    ) {
        return new CustomEvent<NavigateEventDetail>('navigate', {
            bubbles: true,
            detail: {
                routerId: this.routerId,
                route: route,
                routeParams: routeParams,
                replace: replace,
                signal: controller.signal,
                finished: this._finished
            }
        })
    }

    private createFinishedPromise(controller: AbortController) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._animationLayerData.started;
                await this._animationLayerData.finished;
                resolve();
            } catch (e) {
                controller.abort(e);
                reject(e);
            }
        });
    }

    private onNavigateAbort() {
        this._animationLayerData.cancel();
        this.goBack();
    }

    private onBackAbort() {
        this._animationLayerData.cancel();
        if (!this.history.next) return;
        this.navigate(this.history.next);
    }

    assign(url: string | URL) {
        url = new URL(url, window.location.origin);
        if (url.origin === location.origin) {
            this.navigate(url.pathname);
        } else {
            location.assign(url);
        }
    }

    replace(url: string | URL) {
        url = new URL(url, window.location.origin);
        if (url.origin === location.origin) {
            this.navigate(url.pathname, {}, {
                hash: url.hash,
                replace: true
            });
        } else {
            location.replace(url);
        }
    }

    get finished() {
        return this._finished;
    }

    get parent() {
        return this.routerData.parentRouterData?.navigation ?? null;
    }

    get location() {
        const {location} = window;
        const url = concatenateURL(this._history.current, this.history.baseURL);
        return {
            ancestorOrigins: location.ancestorOrigins,
            assign: this.assign.bind(this),
            hash: location.hash,
            host: location.host,
            hostname: location.hostname,
            href: url.href,
            origin: location.origin,
            pathname: url.pathname,
            port: location.port,
            protocol: location.protocol,
            reload() {
                location.reload();
            },
            replace: this.replace.bind(this),
            search: searchParamsFromObject(this._currentParams, this.paramsSerializer || null)
        }
    }
}