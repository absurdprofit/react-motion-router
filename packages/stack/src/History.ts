import { HistoryBase } from "@react-motion-router/core";

export default class History extends HistoryBase {
    private _next: string | null = null;

    constructor(_routerId: number, _defaultRoute: string | null, _baseURL: URL) {
        super(_routerId, _defaultRoute, _baseURL);
        const pathname = window.location.pathname.replace(this.baseURL.pathname, '');
        const searchPart = window.location.search;

        if (_defaultRoute) {
            this.defaultRoute = _defaultRoute;
            const persistedStack = this.state.get<{stack: string[]}>(this.baseURL.pathname)?.stack;
            if (this.defaultRoute !== pathname && !persistedStack?.length) {
                this.replaceState({}, "", History.getURL(this.defaultRoute, this.baseURL));
                this.pushState({}, "", History.getURL(pathname, this.baseURL, searchPart));
                if (!this._stack.length) {
                    this._stack.push(this.defaultRoute);
                    this._stack.push(pathname);
                }
            }
        }
        if (!this._stack.length || !this._stack.includes(pathname))
            this._stack.push(pathname);
    }

    push(route: string, search: string = '', hash: string = '', replace: boolean = false) {
        const url = History.getURL(route, this.baseURL);
        url.hash = hash;
        url.search = search;
        
        this.next = null;
        
        if (replace) {
            this._stack.pop();
            this._stack.push(route);
            this.replaceState({stack: this._stack}, "", url);
        } else {
            this._stack.push(route);
            this.pushState({stack: this._stack}, "", url);
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

    back(replace: boolean): string; // used so the default route will be at the top of the browser stack
    back(): string;
    back(replace?: boolean) {
        this.next = this._stack.pop() || null;
        
        if (replace && this.defaultRoute) {
            this._stack.push(this.defaultRoute);
            this.replaceState({stack: this._stack}, "", this.defaultRoute);
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
        return this._stack.at(-1) || '/';
    }

    get next() {
        let {_next} = this;
        if (_next) {
            return _next;
        }
        return null;
    }

    get previous() {
        if (this._stack.length > 1) {
            return this._stack.at(-2) || null;
        }
        return null;
    }
}