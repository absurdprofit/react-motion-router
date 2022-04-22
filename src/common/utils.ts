import { ParamsDeserialiser, ParamsSerialiser } from "./types";

export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _defaultRoute: string | null = null;
    constructor(_defaultRoute: string | null) {
        const pathname = window.location.pathname;
        const searchPart = window.location.search;
        if (_defaultRoute) {
            this._defaultRoute = _defaultRoute;
            if (this._defaultRoute !== window.location.pathname) {
                this._stack.push(this._defaultRoute);
                window.history.replaceState({}, "", this._defaultRoute);
                window.history.pushState({}, "", pathname + searchPart);
            }
        }
        this._stack.push(pathname);
    }

    set defaultRoute(_defaultRoute: string | null) {
        this._defaultRoute = _defaultRoute;
    }

    get current() {
        return this._stack[this._stack.length - 1];
    }
    get length() {
        return this._stack.length;
    }

    get defaultRoute() {
        return this._defaultRoute;
    }
    get next() {
        return this._next;
    }
    get previous() {
        if (this._stack.length > 1) {
            return this._stack[this._stack.length - 2];
        }
        return null;
    }
    get isEmpty() {
        return !this._stack.length ? true : false;
    }
    
    push(route: string, replace: boolean = false) {
        this._next = null;
        
        if (replace) {
            window.history.replaceState({}, "", route);
            this._stack.pop();
            this._stack.push(route);
        } else {
            window.history.pushState({}, "", route);
            this._stack.push(route);
        }
    }

    implicitPush(route: string, replace: boolean = false) {
        this._next = null; 
        if (replace) {
            this._stack.pop();
            this._stack.push(route);
        } else {
            this._stack.push(route);
        }
    }

    back(replaceState: boolean): string; // used so the default route will be at the top of the browser stack
    back(): string;
    back(replaceState?: boolean) {
        this._next = this._stack.pop() || null;
        
        if (replaceState && this._defaultRoute) {
            this._stack.push(this._defaultRoute);
            window.history.replaceState({}, "", this._defaultRoute);
        } else {
            window.history.back();
        }

        return this.previous;
    }

    implicitBack() {
        this._next = this._stack.pop() || null;

        return this.previous;
    }

    searchParamsToObject(searchPart: string) {
        const entries = new URLSearchParams(decodeURI(searchPart)).entries();
        const result: {[key:string]: string} = {};
        
        for(const [key, value] of entries) { // each 'entry' is a [key, value] tupple
            let parsedValue = '';
            try {
                parsedValue = JSON.parse(value);
            } catch (e) {
                console.warn("Non JSON serialisable value was passed as URL route param.");
                parsedValue = value;
            }
            result[key] = parsedValue;
        }
        return Object.keys(result).length ? result : undefined;
    }
}

export type BackEvent = CustomEvent<{replaceState:boolean}>;
interface NavigateEventDetail {
    route: string;
    routeParams?: any;
}
export type NavigateEvent = CustomEvent<NavigateEventDetail>;

export class Navigation {
    private _history;
    private _disableBrowserRouting: boolean;
    private _currentParams: {[key:string]: any} = {};
    private _paramsSerialiser?: ParamsSerialiser;
    private _paramsDeserialiser?: ParamsDeserialiser;

    constructor(_disableBrowserRouting: boolean, _defaultRoute?: string | null) {
        this._disableBrowserRouting = _disableBrowserRouting;
        this._history = new History(_defaultRoute || null);
    }

    navigate(route: string, routeParams?: {[key:string]: any}, replace?: boolean) {
        if (this._disableBrowserRouting) {
            this._history.implicitPush(route);
        } else {
            this._history.push(route, Boolean(replace));
        }

        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                route: route,
                routeParams: routeParams
            }
        });

        window.dispatchEvent(event);
        this._currentParams = routeParams || {};
    }

    implicitNavigate(route: string, routeParams?: {[key:string]: any}) {
        this._history.implicitPush(route);
        
        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                route: route,
                routeParams: routeParams
            }
        });

        window.dispatchEvent(event);
        this._currentParams = routeParams || {};
    }

    implicitBack() {
        this._history.implicitBack();
        let event = new CustomEvent<{replaceState:boolean}>('go-back', {
            detail: {
                replaceState: false
            }
        });
        window.dispatchEvent(event);
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

        window.dispatchEvent(event);
    }

    searchParamsToObject(searchPart: string) {
        const deserialiser = this._paramsDeserialiser || this._history.searchParamsToObject;
        this._currentParams = deserialiser(searchPart) || {};
        return this._currentParams;
    }

    searchParamsFromObject(params: {[key: string]: any}) {
        try {
            const serialiser = this._paramsSerialiser || function(paramsObj) {
                return new URLSearchParams(paramsObj).toString();
            }
            return serialiser(params);
        } catch (e) {
            console.error(e);
            console.warn("Non JSON serialisable value was passed as route param to Anchor.");
        }
        return '';
    }

    private assign(url: string | URL) {
        url = new URL(url, window.location.origin);
        if (url.origin === location.origin) {
            this.navigate(url.pathname);
        } else {
            location.assign(url);
        }
    }

    private replace(url: string | URL) {
        url = new URL(url, window.location.origin);
        if (url.origin === location.origin) {
            this.navigate(url.pathname, {}, true);
        } else {
            location.replace(url);
        }
    }

    set paramsDeserialiser(_paramsDeserialiser: ParamsDeserialiser | undefined) {
        this._paramsDeserialiser = _paramsDeserialiser;
    }

    set paramsSerialiser(_paramsSerialiser: ParamsSerialiser | undefined) {
        this._paramsSerialiser = _paramsSerialiser;
    }

    get paramsDeserialiser(): ParamsDeserialiser | undefined {
        return this._paramsDeserialiser;
    }

    get paramsSerialiser(): ParamsSerialiser | undefined {
        return this._paramsSerialiser;
    }

    get history() {
        return this._history;
    }

    get location(): Location {
        const {location} = window;
        
        return {
            ancestorOrigins: location.ancestorOrigins,
            pathname: this._history.current,
            href: `${window.location.origin}/${this._history.current.substring(1)}`,
            host: location.host,
            hash: location.hash,
            hostname: location.hostname,
            port: location.port,
            protocol: location.protocol,
            search: this.searchParamsFromObject(this._currentParams),
            origin: location.origin,
            replace: this.replace.bind(this),
            reload() {
                location.reload();
            },
            assign: this.assign.bind(this)
        }
    }
}

export interface Vec2 {
    x: number;
    y: number;
}

export function getCSSData(styles: CSSStyleDeclaration, object: boolean = true): [string, {[key:string]:string}] {
    let text = '';
    const styleObject: {[key:string]: string} = {};
    let j = 0;
    for (let property in styles) {
        if (j < styles.length) {
            const propertyName = styles[property];
            const propertyValue = styles.getPropertyValue(propertyName);
            text += `${propertyName}:${propertyValue};`;
        } else {
            if (!object) break;
            let propertyName = property;
            const propertyValue = styles[propertyName as any];
            if (
                typeof propertyValue === "string"
                && propertyName !== "cssText"
                && !propertyName.includes('webkit')
                && !propertyName.includes('grid')
            ) {
                if (propertyName === "offset") propertyName = "cssOffset";
                if (propertyName === "float") propertyName = "cssFloat";
                styleObject[propertyName] = propertyValue;
            }
        }
        j++;
    }
    return [text, styleObject];
}

export function getStyleObject(styles: CSSStyleDeclaration): {[key:string]: string} {
    const styleObject: {[key:string]:string} = {};
    for (const key in styles) {
        if (styles[key] && styles[key].length && typeof styles[key] !== "function") {
            if (/^\d+$/.test(key)) continue;
            if (key === "offset") continue;
            styleObject[key] = styles[key];
        }
    }
    return styleObject;
}
export function clamp(num: number, min: number, max?: number) {
    if (num < min) {
        return min;
    } else if (max && num > max) {
        return max;
    }
    return num;
}

export function matchRoute(routeTest: string | RegExp | undefined, routeString: string | undefined): boolean {
    if (typeof routeTest === "string" || typeof routeTest === "undefined") {
        return routeTest === routeString;
    }
    if (routeTest instanceof RegExp && routeString) {
        return routeTest.test(routeString);
    } else {
        return false;
    }
}

export function includesRoute(routeString: string | undefined, routeTests: (string | RegExp | undefined)[]) {
    return routeTests.some((routeTest) => matchRoute(routeTest, routeString));
}

export function sleep(duration: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve, duration);
    });
}