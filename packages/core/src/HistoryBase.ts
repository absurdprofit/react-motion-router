export default abstract class HistoryBase {
    private _baseURL: URL;
    protected _stack: string[] = [];
    // private _stack: string[] = [];
    private _defaultRoute: string;
    constructor(_defaultRoute: string | null) {
        this._baseURL = new URL(window.location.pathname, window.location.origin);

        this._defaultRoute = _defaultRoute || this._baseURL.pathname;        
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