import { ParamsDeserialiser, ParamsSerialiser } from "./common/types";
import HistoryBase from "./HistoryBase";
import MetaData from "./MetaData";

export interface BackEventDetail {
    replace: boolean;
    signal: AbortSignal;
}

export interface NavigateEventDetail {
    routerId: number;
    route: string;
    routeParams?: any;
    replace: boolean;
    signal: AbortSignal;
}

export type NavigateEvent = CustomEvent<NavigateEventDetail>;
export type BackEvent = CustomEvent<BackEventDetail>;

export interface NavigationOptions {
    replace?: boolean;
}

export interface NavigateOptions extends NavigationOptions {
    hash?: string;
}

export interface GoBackOptions extends NavigationOptions {}

export default abstract class NavigationBase {
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    protected readonly _routerId: number;
    private _metaData = new MetaData();
    protected abstract _history: HistoryBase;
    protected readonly _disableBrowserRouting: boolean;
    protected _currentParams: {[key:string]: any} = {};
    private _paramsSerialiser?: ParamsSerialiser;
    private _paramsDeserialiser?: ParamsDeserialiser;
    protected _dispatchEvent: ((event: Event) => Promise<boolean>) | null = null;

    constructor(_routerId: number, _disableBrowserRouting: boolean = false, _defaultRoute: string | null = null) {
        this._disableBrowserRouting = _disableBrowserRouting;
        this._routerId = _routerId;
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        if (!rootNavigator || !rootNavigator.isInDocument)
            NavigationBase.rootNavigatorRef = new WeakRef(this);

        window.addEventListener('popstate', (e) => {
            const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
            const isRoot = rootNavigator?.routerId === this.routerId;
            if ((this.history.state.get<number>('routerId') === null && isRoot)
                || this.history.state.get<number>('routerId') === this._routerId
            ) {
                this.onPopState(e);
            }
        });
    }

    get routerId() {
        return this._routerId;
    }

    abstract onPopState(e: Event): void;

    abstract navigate(route: string, routeParams?: {[key:string]: any}, options?: NavigateOptions): void;

    abstract goBack(options?: GoBackOptions): void;

    searchParamsToObject(searchPart: string) {
        const deserialiser = this._paramsDeserialiser || this._history.searchParamsToObject;
        this._currentParams = deserialiser(searchPart) || {};
        return this._currentParams;
    }

    searchParamsFromObject(params: {[key: string]: any}) {
        try {
            const serialiser = this._paramsSerialiser || function(paramsObj) {
                return new URLSearchParams(paramsObj).toString();
            }
            return serialiser(params);
        } catch (e) {
            console.error(e);
            console.warn("Non JSON serialisable value was passed as route param to Anchor.");
        }
        return '';
    }

    set dispatchEvent(_dispatchEvent: ((event: Event) => Promise<boolean>) | null) {
        this._dispatchEvent = _dispatchEvent;
    }

    set paramsDeserialiser(_paramsDeserialiser: ParamsDeserialiser | undefined) {
        this._paramsDeserialiser = _paramsDeserialiser;
    }

    set paramsSerialiser(_paramsSerialiser: ParamsSerialiser | undefined) {
        this._paramsSerialiser = _paramsSerialiser;
    }

    get paramsDeserialiser(): ParamsDeserialiser | undefined {
        return this._paramsDeserialiser;
    }

    get paramsSerialiser(): ParamsSerialiser | undefined {
        return this._paramsSerialiser;
    }

    get history() {
        return this._history;
    }

    get metaData() {
        return this._metaData;
    }
    
    abstract get location(): Location;

    private get isInDocument() {
        return document.getElementById(`${this.routerId}`);
    }
}