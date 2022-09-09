import { HistoryBase } from "@react-motion-router/core";

export default class History extends HistoryBase {
    private _next: string | null = null;

    constructor(_defaultRoute: string | null) {
        super(_defaultRoute);

        const pathname = this.baseURL.pathname === window.location.pathname ? '/' : this.baseURL.pathname;
        const searchPart = window.location.search;

        if (_defaultRoute) {
            this.defaultRoute = _defaultRoute;
            if (this.defaultRoute !== window.location.pathname) {
                this._stack.push(this.defaultRoute);
                window.history.replaceState({}, "", History.getURL(this.defaultRoute, this.baseURL));
                window.history.pushState({}, "", History.getURL(pathname, this.baseURL, searchPart));
            }
        }
        this._stack.push(pathname);
    }

    push(route: string, hash: string = '', replace: boolean = false) {
        const url = History.getURL(route, this.baseURL);
        url.hash = hash;
        
        this.next = null;
        
        if (replace) {
            window.history.replaceState({}, "", url);
            this._stack.pop();
            this._stack.push(route);
        } else {
            window.history.pushState({}, "", url);
            this._stack.push(route);
        }
    }

    implicitPush(route: string, replace: boolean = false) {
        this.next = null; 
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
        this.next = this._stack.pop() || null;
        
        if (replaceState && this.defaultRoute) {
            this._stack.push(this.defaultRoute);
            window.history.replaceState({}, "", this.defaultRoute);
        } else {
            window.history.back();
        }

        return this.previous;
    }

    implicitBack() {
        this.next = this._stack.pop() || null;

        return this.previous;
    }

    set next(_next: string | null) {
        this._next = _next;
    }

    get current() {
        let _current: string | undefined = this._stack[this._stack.length - 1];
        _current = _current.replace(new RegExp(this.baseURL.pathname + '$'), '');
        return new URL(_current, window.location.origin).pathname;
    }

    get next() {
        let {_next} = this;
        if (_next) {
            _next = _next.replace(new RegExp(this.baseURL.pathname + '$'), '');
            return new URL(_next, window.location.origin).pathname;
        }
        return null;
    }

    get previous() {
        if (this._stack.length > 1) {
            let _previous = this._stack[this._stack.length - 2];
            _previous = _previous.replace(new RegExp(this.baseURL.pathname + '$'), '');
            return new URL(_previous, window.location.origin).pathname;
        }
        return null;
    }
}