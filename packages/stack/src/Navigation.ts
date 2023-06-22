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
        this._animationLayerData.started.then(() => this._animationLayerData.finished.catch(() => controller.abort()));

        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                routerId: this.routerId,
                route: route,
                routeParams: routeParams,
                replace: Boolean(replace),
                signal: controller.signal
            },
            bubbles: true
        });

        if (this.dispatchEvent) this.dispatchEvent(event);
        this._currentParams = routeParams || {};

        return new Promise<void>(async (resolve, reject) => {
            await this._animationLayerData.started;
            this._animationLayerData.finished.then(resolve).catch(reject);
        });
    }

    private implicitNavigate(route: string, routeParams?: PlainObject) {
        this._history.implicitPush(route);
        
        const controller = new AbortController();
        this._animationLayerData.started.then(() => this._animationLayerData.finished.catch(() => controller.abort()));

        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                routerId: this.routerId,
                route: route,
                routeParams: routeParams,
                replace: false,
                signal: controller.signal
            },
            bubbles: true
        });

        if (this.dispatchEvent) this.dispatchEvent(event);
        this._currentParams = routeParams || {};
    }

    private implicitBack() {
        this._history.implicitBack();

        const controller = new AbortController();
        this._animationLayerData.started.then(() => this._animationLayerData.finished.catch(() => controller.abort()));

        let event = new CustomEvent<BackEventDetail>('go-back', {
            detail: {
                replace: false,
                signal: controller.signal
            }
        });
        if (this.dispatchEvent) this.dispatchEvent(event);
    }

    goBack(options: GoBackOptions = {}) {
        this.isInternalBack = true;
        const {replace} = options;

        const controller = new AbortController();
        this._animationLayerData.started.then(() => this._animationLayerData.finished.catch(() => controller.abort()));


        let event = new CustomEvent<BackEventDetail>('go-back', {
            detail: {
                replace: Boolean(replace),
                signal: controller.signal
            }
        });
        if (this._history.length === 1) {
            if (this.parent === null) {
                // if no history in root router, fallback to browser back
                window.history.back();
                return;
            }
            this.parent.goBack();
        } else {
            if (this._disableBrowserRouting) {
                this._history.implicitBack();
            } else {
                this._history.back(Boolean(replace));
            }
        } 

        if (this.dispatchEvent) this.dispatchEvent(event);

        return new Promise<void>(async (resolve, reject) => {
            await this._animationLayerData.started;
            this._animationLayerData.finished.then(resolve).catch(reject);
        });
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