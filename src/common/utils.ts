export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _previous: string | null = null;
    private _default_route: string | null = null;
    constructor() {
        this._stack.push(window.location.pathname);
    }

    set default_route(_default_route: string | null) {
        this._default_route = _default_route;
    }

    get default_route() {
        return this._default_route;
    }
    get next() {
        return this._next;
    }
    get previous() {
        return this._previous;
    }
    get is_empty() {
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

    search_params_to_object(search_part: string) {
        const entries = new URLSearchParams(decodeURI(search_part)).entries();
        const result: {[key:string]: string} = {};
        
        for(const [key, value] of entries) { // each 'entry' is a [key, value] tupple
            let parsed_value = '';
            try {
                parsed_value = JSON.parse(value);
            } catch (e) {
                console.warn("Non JSON seralisable value was passed as URL route param.");
                parsed_value = value;
            }
            result[key] = parsed_value;
        }
        return Object.keys(result).length ? result : undefined;
    }
}
export class Navigation {
    private _history = new History();
    navigate(route: string, route_params?: any) {
        this._history.push(route);

        const event = new CustomEvent('navigate', {
            detail: {
                route: route,
                route_params: route_params
            }
        });

        window.dispatchEvent(event);
    }

    go_back() {
        if (this._history.default_route && !this._history.previous) {
            this.navigate(this._history.default_route);
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

export function get_css_text(styles: CSSStyleDeclaration): string {
    if (styles.cssText !== '') {
        return styles.cssText;
    } else {
        const css_text = Object.values(styles).reduce(
            (css, property_name) =>
                `${css}${property_name}:${styles.getPropertyValue(
                    property_name
                )};`
        );

        return css_text;
    }
}

export function get_style_object(styles: CSSStyleDeclaration): {[key:string]: string} {
    const style_object: {[key:string]:string} = {};
    for (const key in styles) {
        if (styles[key] && styles[key].length && typeof styles[key] !== "function") {
            if (/^\d+$/.test(key)) continue;
            if (key === "offset") continue;
            style_object[key] = styles[key];
        }
    }
    return style_object;
}
export function clamp(num: number, min: number, max?: number) {
    if (num < min) {
        return min;
    } else if (max && num > max) {
        return max;
    }
    return num;
}