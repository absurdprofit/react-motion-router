export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _previous: string | null = null;
    constructor() {
        this._stack.push(window.location.pathname);
    }
    get next() {
        return this._next;
    }
    get previous() {
        return this._previous;
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
        this._history.back();

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

export function clamp(num: number, min: number, max?: number) {
    if (num < min) {
        return min;
    } else if (max && num > max) {
        return max;
    }
    return num;
}