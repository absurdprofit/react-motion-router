export default abstract class HistoryBase {
    private _baseURL: URL;
    protected _stack: string[] = [];
    private _defaultRoute: string;
    
    constructor(_defaultRoute: string | null, _baseURL?: URL) {
        if (!document.querySelector('.react-motion-router'))
            _baseURL = _baseURL || new URL('/', window.location.origin); // if base URL unspecified base URL is '/'
        
            
        _baseURL = _baseURL || new URL(window.location.toString());
        _baseURL = new URL(_baseURL.href.replace(/\/$/, '')); // negate trailing slash
        this._baseURL = _baseURL;

        this._defaultRoute = _defaultRoute || this._baseURL.pathname;
        if (!window.history.state)
            window.history.replaceState({}, "", window.location.toString());

        if (!this.state.has(this.baseURL.pathname)) this.state.set(this.baseURL.pathname, {});
        const persistedStack = this.state.get(this.baseURL.pathname)?.stack as string[] || undefined;
        if (persistedStack) this._stack = [...persistedStack.filter(entry => Boolean(entry))];
        else this.state.get(this.baseURL.pathname).stack = [...this._stack];

        this._stack = new Proxy(this._stack, {set: this.onStackUpdate.bind(this)});
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

    abstract get next(): string | null;

    abstract get previous(): string | null;

    get isEmpty() {
        return !this._stack.length ? true : false;
    }

    get baseURL() {
        return this._baseURL;
    }
    
    protected get state() {
        return {
            set<K, V>(key: K, value: V) {
                if (window.history.state) {
                    window.history.state[key] = value;
                    return true;
                }
                return false;
            },
            get<K>(key: K) {
                if (window.history.state) {
                    return window.history.state[key] || null;
                } 
                return null;
            },
            has<K>(key: K) {
                if (!window.history.state) return false;
                return key in window.history.state;
            },
            delete<K>(key: K) {
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
            }
        };
        window.history.pushState(data, unused, url);
    }

    protected replaceState(data: any, unused: string, url?: string | URL | null | undefined) {
        data = {
            ...window.history.state,
            [this.baseURL.pathname]: {
                ...window.history.state[this.baseURL.pathname],
                ...data
            }
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

    searchParamsToObject(searchPart: string) {
        const entries = new URLSearchParams(decodeURI(searchPart)).entries();
        const result: {[key:string]: string} = {};
        
        for(const [key, value] of entries) { // each 'entry' is a [key, value] tuple
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

    private onStackUpdate(target: string[], p: string | symbol, newValue: any, receiver: any) {
        if (this.state.has(this.baseURL.pathname)) {
            if (!this.state.get(this.baseURL.pathname).stack)
                this.state.get(this.baseURL.pathname).stack = [...this._stack];
            const stack = this.state.get(this.baseURL.pathname).stack;
            Reflect.set(stack, p, newValue, stack);
        }
        console.log({p, newValue});
        return Reflect.set(target, p, newValue, receiver);
    }
}