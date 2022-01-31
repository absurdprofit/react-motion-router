export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _previous: string | null = null;
    private _defaultRoute: string | null = null;
    constructor() {
        this._stack.push(window.location.pathname);
    }

    set defaultRoute(_defaultRoute: string | null) {
        this._defaultRoute = _defaultRoute;
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

    back() {
        this._next = this._previous;
        this._previous = this._stack.pop() || null;

        window.history.back();

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

    goBack() {
        if (this._history.defaultRoute && !this._history.previous) {
            this.navigate(this._history.defaultRoute);
        } else {
            this._history.back();
        }  
        const event = new CustomEvent('go-back');

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
