export default abstract class HistoryBase {
    private _baseURL: URL;
    protected _stack: string[] = [];
    private _defaultRoute: string | null;
    protected readonly _routerId: string;
    
    constructor(_routerId: string, _defaultRoute: string | null, _baseURL: URL) {
        this._routerId = _routerId;
        window.history.replaceState({...history.state, routerId: this._routerId}, "", window.location.toString());
            
        _baseURL = _baseURL || new URL(window.location.toString());
        _baseURL = new URL(_baseURL.href.replace(/\/$/, '')); // negate trailing slash
        this._baseURL = _baseURL;

        this._defaultRoute = _defaultRoute;
        if (!this.state.has(this.baseURL.pathname)) this.state.set(this.baseURL.pathname, {});
        const persistedStack = this.state.get<{stack: string[]}>(this.baseURL.pathname)?.stack;
        if (persistedStack) this._stack = [...persistedStack.filter(entry => Boolean(entry))];
        else {
            if (this.state.has(this.baseURL.pathname))
                this.state.get<{stack: string[]}>(this.baseURL.pathname)!.stack = [...this._stack];
        }
    }

    protected abstract set next(_next: string | null);

    protected set defaultRoute(_defaultRoute: string) {
        this._defaultRoute = _defaultRoute;
    }

    abstract get current(): string;

    get length() {
        return this._stack.length;
    }

    get defaultRoute(): string {
        return this._defaultRoute || '/';
    }

    abstract canGoBack(): boolean;

    abstract get next(): string | null;

    abstract get previous(): string | null;

    get isEmpty() {
        return !this._stack.length ? true : false;
    }

    get baseURL() {
        return this._baseURL;
    }
    
    get state() {
        return {
            set<V>(key: string | number | symbol, value: V) {
                if (window.history.state) {
                    window.history.state[key] = value;
                    return true;
                }
                return false;
            },
            get<V>(key: string | number | symbol): V | null {
                if (window.history.state) {
                    return window.history.state[key] || null;
                } 
                return null;
            },
            has(key: string | number | symbol) {
                if (!window.history.state) return false;
                return key in window.history.state;
            },
            delete(key: string | number | symbol) {
                if (!window.history.state) return false;
                return delete window.history.state[key];
            },
            keys() {
                return Object.keys(window.history.state || {});
            },
            values() {
                return Object.values(window.history.state || {});
            },
            clear() {
                return this.keys().forEach(key => delete window.history.state[key]);
            },
            get length() {
                return this.keys().length;
            }
        }
    }

    protected pushState(data: any, unused: string, url?: string | URL | null | undefined) {
        data = {
            ...window.history.state,
            [this.baseURL.pathname]: {
                ...window.history.state[this.baseURL.pathname],
                ...data
            },
            routerId: this._routerId
        };
        
        window.history.pushState(data, unused, url);
    }

    protected replaceState(data: any, unused: string, url?: string | URL | null | undefined) {
        data = {
            ...window.history.state,
            [this.baseURL.pathname]: {
                ...window.history.state[this.baseURL.pathname],
                ...data
            },
            routerId: this._routerId
        };
        window.history.replaceState(data, unused, url);
    }

    protected static getURL(route: string, baseURL: URL, search: string = '') {
        if (!baseURL.pathname.match(/\/$/))
            baseURL = new URL(baseURL.href + '/');
        
        if (route.match(/^\//))
            route = route.slice(1);
        
        const url = new URL(route, baseURL);
        url.search = search;
        return url;
    }
}