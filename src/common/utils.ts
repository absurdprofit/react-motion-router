export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _defaultRoute: string | null = null;
    constructor(_defaultRoute: string | null) {
        const pathname = window.location.pathname + window.location.search;
        if (_defaultRoute) {
            this._defaultRoute = _defaultRoute;
            if (this._defaultRoute !== window.location.pathname) {
                this._stack.push(this._defaultRoute);
                window.history.replaceState({}, "", this._defaultRoute);
                window.history.pushState({}, "", pathname);
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
    
    push(route: string) {
        this._next = null;
        
        window.history.pushState({}, "", route);

        this._stack.push(route);
    }

    implicitPush(route: string) {
        this._next = null; 
        this._stack.push(route);
    }

    back(replaceState: boolean): string;
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
                console.warn("Non JSON seralisable value was passed as URL route param.");
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

    constructor(_disableBrowserRouting: boolean, _defaultRoute?: string | null) {
        this._disableBrowserRouting = _disableBrowserRouting;
        this._history = new History(_defaultRoute || null);
    }

    navigate(route: string, routeParams?: any) {
        if (this._disableBrowserRouting) {
            this._history.implicitPush(route);
        } else {
            this._history.push(route);
        }

        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                route: route,
                routeParams: routeParams
            }
        });

        window.dispatchEvent(event);
    }

    implicitNavigate(route: string, routeParams?: any) {
        this._history.implicitPush(route);
        
        const event = new CustomEvent<NavigateEventDetail>('navigate', {
            detail: {
                route: route,
                routeParams: routeParams
            }
        });

        window.dispatchEvent(event);
    }

    implicitBack() {
        this._history.implicitBack();
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

    get history() {
        return this._history;
    }

    get location() {
        return {
            ...window.location,
            pathname: this._history.current
        }
    }
}

export interface Vec2 {
    x: number;
    y: number;
}

export function getCSSData(styles: CSSStyleDeclaration): [string, {[key:string]:string}] {
    const values = Object.values(styles).slice(0, styles.length - 1);
    let cssText = '';
    const styleObject: {[key:string]:string} = {};
    values.map(
        (propertyName) => {
            const propertyValue = styles.getPropertyValue(propertyName);
            const camelCasePropertyName = propertyName.replace(/^-/, '').replace(/-([a-z])/g,
            function (m, s) {
                return s.toUpperCase();
            });
            cssText += `${propertyName}:${propertyValue};`;
            styleObject[camelCasePropertyName] = propertyValue;
        }
    );

    return [cssText, styleObject];
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
