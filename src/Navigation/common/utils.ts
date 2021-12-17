export class History {
    private _stack: string[] = [];
    private _next: string | null = null;
    private _previous: string | null = null;
    get next() {
        return this._next;
    }
    get previous() {
        return this._previous;
    }
    push(route: string) {
        this._next = route;
        window.history.pushState({}, "", route);
        this._stack.push(route);
    }

    back() {
        this._previous = this._stack.pop() || null;
        window.history.back();
        return this._previous;
    }
}
export class Navigation {
    private history = new History();
    navigate(route: string, route_params?: any) {
        this.history.push(route);

        const event = new CustomEvent('navigate', {
            detail: {
                route: route,
                route_params: route_params
            }
        });

        window.dispatchEvent(event);
    }

    go_back() {
        this.history.back();

        const event = new CustomEvent('go-back');

        window.dispatchEvent(event);  
    }
}