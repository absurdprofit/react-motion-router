import { NavigateEventDetail, NavigationBase } from '@react-motion-router/core';
import History from './History';

export default class Navigation extends NavigationBase {
    _history: History;

    constructor(_id: number, _history: History, _disableBrowserRouting: boolean = false, _defaultRoute: string | null = null) {
        super(_id, _disableBrowserRouting, _defaultRoute);

        this._history = _history;
    }

    navigate(route: string, routeParams?: {[key:string]: any}, replace?: boolean) {
        if (this._disableBrowserRouting) {
            this._history.implicitPush(route, Boolean(replace));
        } else {
            this._history.push(route, Boolean(replace));
        }

        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                id: this.id,
                route: route,
                routeParams: routeParams
            },
            bubbles: true
        });

        if (this._dispatchEvent) this._dispatchEvent(event);
        this._currentParams = routeParams || {};
    }

    implicitNavigate(route: string, routeParams?: {[key:string]: any}) {
        this._history.implicitPush(route);
        
        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                id: this.id,
                route: route,
                routeParams: routeParams
            },
            bubbles: true
        });

        if (this._dispatchEvent) this._dispatchEvent(event);
        this._currentParams = routeParams || {};
    }

    implicitBack() {
        this._history.implicitBack();
        let event = new CustomEvent<{replaceState:boolean}>('go-back', {
            detail: {
                replaceState: false
            }
        });
        if (this._dispatchEvent) this._dispatchEvent(event);
    }

    goBack() {
        let event = new CustomEvent<{replaceState:boolean}>('go-back', {
            detail: {
                replaceState: false
            }
        });
        if (this._history.defaultRoute && this._history.length === 1) {
            this._history.back(true);
            event = new CustomEvent<{replaceState:boolean}>('go-back', {
                detail: {
                    replaceState: true
                }
            });
        } else {
            if (this._disableBrowserRouting) {
                this._history.implicitBack();
            } else {
                this._history.back();
            }
        } 

        if (this._dispatchEvent) this._dispatchEvent(event);

        return new Promise<void>((resolve) => {
            window.addEventListener('page-animation-end', () => resolve(), {once: true});
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
            this.navigate(url.pathname, {}, true);
        } else {
            location.replace(url);
        }
    }

    get location() {
        const {location} = window;
        
        return {
            ancestorOrigins: location.ancestorOrigins,
            assign: this.assign.bind(this),
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
            replace: this.replace.bind(this),
            search: this.searchParamsFromObject(this._currentParams)
        }
    }
}