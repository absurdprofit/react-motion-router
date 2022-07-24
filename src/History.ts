export default class History {
    private _baseURL: URL;
    protected _stack: string[] = [];
    // private _stack: string[] = [];
    private _next: string | null = null;
    private _defaultRoute: string;
    constructor(_defaultRoute: string | null) {
        this._baseURL = new URL(window.location.pathname, window.location.origin);

        this._defaultRoute = _defaultRoute || this._baseURL.pathname;

        const pathname = this._baseURL.pathname === window.location.pathname ? '/' : this._baseURL.pathname;
        const searchPart = window.location.search;
        if (_defaultRoute) {
            this._defaultRoute = _defaultRoute;
            if (this._defaultRoute !== window.location.pathname) {
                this._stack.push(this._defaultRoute);
                window.history.replaceState({}, "", History.getURL(this._defaultRoute, this._baseURL));
                window.history.pushState({}, "", History.getURL(pathname, this._baseURL, searchPart));
            }
        }
        this._stack.push(pathname);
    }

    set defaultRoute(_defaultRoute: string | null) {
        this._defaultRoute = _defaultRoute || '/';
    }

    get current() {
        let _current: string | undefined = this._stack[this._stack.length - 1];
        _current = _current.replace(new RegExp(this._baseURL.pathname + '$'), '');
        return new URL(_current, window.location.origin).pathname;
    }
    get length() {
        return this._stack.length;
    }

    get defaultRoute(): string {
        return this._defaultRoute || '/';
    }
    get next() {
        let {_next} = this;
        if (_next) {
            _next = _next.replace(new RegExp(this._baseURL.pathname + '$'), '');
            return new URL(_next, window.location.origin).pathname;
        }
        return null;
    }
    get previous() {
        if (this._stack.length > 1) {
            let _previous = this._stack[this._stack.length - 2];
            _previous = _previous.replace(new RegExp(this._baseURL.pathname + '$'), '');
            return new URL(_previous, window.location.origin).pathname;
        }
        return null;
    }
    get isEmpty() {
        return !this._stack.length ? true : false;
    }
    get path() {
        if (this._stack.length === 1) return window.location.href;
        return this._stack.reduce((accumulator, currentValue) => new URL(currentValue, new URL(accumulator, window.location.origin)).href);
    }
    get baseURL() {
        return this._baseURL;
    }

    private static getURL(route: string, baseURL: URL, search: string = '') {
        const path = [
            ...baseURL.pathname.split('/').filter(path => path.length),
            ...route.split('/').filter(path => path.length)
        ].join('/');

        const url = new URL(path, baseURL);
        url.search = search;
        return url;
    }
    
    push(route: string, replace: boolean = false) {
        const url = History.getURL(route, this._baseURL);
        
        this._next = null;
        
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