export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _previous: string | null = null;
    private _defaultRoute: string | null = null;
    constructor() {
        this._stack.push(window.location.pathname);
    }

    set defaultRoute(_defaultRoute: string | null) {
        if (window.location.pathname !== _defaultRoute) {
            this._previous = _defaultRoute;
        }
        this._defaultRoute = _defaultRoute;
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
        return this._previous;
    }
    get isEmpty() {
        return !this._stack.length ? true : false;
    }
    
    push(route: string) {
        this._previous = window.location.pathname;
        this._next = route;
        
        window.history.pushState({}, "", route);

        this._stack.push(route);
    }

    implicitPush(route: string) {
        this._previous = this._stack[this._stack.length - 1] || null;
        this._next = route; 
        this._stack.push(route);
    }

    back(replaceState: boolean): string;
    back(): string;
    back(replaceState?: boolean) {
        this._next = this._stack.pop() || null;
        this._previous = this._stack[this._stack.length - 2] || null;
        
        if (replaceState && this._defaultRoute) {
            window.history.replaceState({}, "", this._defaultRoute);
        } else {
            window.history.back();
        }

        return this._previous;
    }

    implicitBack() {
        this._next = this._stack.pop() || null;
        this._previous = this._stack[this._stack.length - 2] || null;

        return this._previous;
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
export class Navigation {
    private _history = new History();
    navigate(route: string, routeParams?: any) {
        this._history.push(route);

        const event = new CustomEvent('navigate', {
            detail: {
                route: route,
                routeParams: routeParams
            }
        });

        window.dispatchEvent(event);
    }

    implicitNavigate(route: string, routeParams?: any) {
        this._history.implicitPush(route);
        
        const event = new CustomEvent('navigate', {
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
            this._history.back();
        } 

        window.dispatchEvent(event);
    }

    get history() {
        return this._history;
    }
}

export interface Vec2 {
    x: number;
    y: number;
}

export function getCssText(styles: CSSStyleDeclaration): string {
    if (styles.cssText !== '') {
        return styles.cssText;
    } else {
        const cssText = Object.values(styles).reduce(
            (css, propertyName) =>
                `${css}${propertyName}:${styles.getPropertyValue(
                    propertyName
                )};`
        );

        return cssText;
    }
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
