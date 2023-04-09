import { NavigationBase, NavigateEventDetail, matchRoute, NavigateOptions, BackEventDetail, searchParamsFromObject, RouterData } from '@react-motion-router/core';
import TabHistory, { BackBehaviour } from './TabHistory';

export default class TabNavigation extends NavigationBase {
    _history: TabHistory;
    private isInternalBack = false;

    constructor(
        _routerId: number,
        _routerData: RouterData<TabNavigation>,
        _disableBrowserRouting: boolean = false,
        _defaultRoute: string | null = null,
        _baseURL: URL,
        _stack: string[] = [],
        _backBehaviour: BackBehaviour = "none"
    ) {
        super(_routerId, _routerData, _disableBrowserRouting, _defaultRoute);

        const _history = new TabHistory(_routerId, _defaultRoute, _baseURL, _stack, _backBehaviour);
        this._history = _history;
    }

    implicitNavigate(route: string, routeParams?: {[key:string]: any}) {
        this.navigate(route, routeParams);
    }

    implicitBack() {
        this.goBack();
    }

    onPopState = (e: Event) => {
        e.preventDefault();
        if (this.history.state.get<number>('routerId') === this._routerId) {
            console.log("Tab Router Match");
        }
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

    navigate(route: string, routeParams?: {[key:string]: any}, options: NavigateOptions = {}) {
        const index = this._history.stack?.findIndex(tabRoute => {
            return matchRoute(route, tabRoute);
        });

        const delta = (index + 1) - (this._history.index + 1);

        this.go(delta, routeParams);
    }

    goBack() {
        this.go(-1);
    }

    go(delta: number, routeParams?: {[key:string]: any}) {
        if (!delta) return;

        this._history.go(delta);

        if (delta > 0) { // navigate
            const event = new CustomEvent<NavigateEventDetail>('navigate', {
                detail: {
                    routerId: this._routerId,
                    route: this._history.current,
                    routeParams: routeParams,
                    replace: false,
                    signal: null as unknown as AbortSignal
                },
                bubbles: true
            });
    
            if (this.dispatchEvent) this.dispatchEvent(event);
            this._currentParams = {};
        } else { // go back
            let event = new CustomEvent<BackEventDetail>('go-back', {
                detail: {
                    replace: false,
                    signal: null as unknown as AbortSignal
                }
            });
    
            if (this.dispatchEvent) this.dispatchEvent(event);
        }
    }
    
    get history(): TabHistory {
        return this._history;
    }

    _assign(url: string | URL) {
        url = new URL(url, window.location.origin);
        if (url.origin === window.location.origin) {
            this.navigate(url.pathname);
        } else {
            window.location.assign(url);
        }
    }

    _replace(url: string | URL) {
        url = new URL(url, window.location.origin);
        if (url.origin === window.location.origin) {
            this.navigate(url.pathname, {}, {
                hash: '',
                replace: true
            });
        } else {
            window.location.replace(url);
        }
    }

    get location() {
        const {location} = window;
        
        return {
            ancestorOrigins: location.ancestorOrigins,
            assign: this._assign.bind(this),
            hash: location.hash,
            host: location.host,
            hostname: location.hostname,
            href: new URL(this._history.current, location.origin).href,
            origin: location.origin,
            pathname: this._history.current,
            port: location.port,
            protocol: location.protocol,
            reload() {
                location.reload();
            },
            replace: this._replace.bind(this),
            search: searchParamsFromObject(this._currentParams, this.paramsSerializer || null)
        }
    }
}