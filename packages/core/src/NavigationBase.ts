import { ParamsDeserializer, ParamsSerializer } from "./common/types";
import HistoryBase from "./HistoryBase";
import MetaData from "./MetaData";
import RouterData from "./RouterData";

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
    protected readonly routerData: RouterData;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    protected readonly _routerId: number;
    private _metaData = new MetaData();
    protected abstract _history: HistoryBase;
    protected readonly _disableBrowserRouting: boolean;
    protected _currentParams: {[key:string]: any} = {};

    constructor(_routerId: number, _routerData: RouterData, _disableBrowserRouting: boolean = false, _defaultRoute: string | null = null) {
        this.routerData = _routerData;
        this._disableBrowserRouting = _disableBrowserRouting;
        this._routerId = _routerId;
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        if (!rootNavigator || !rootNavigator.isInDocument)
            NavigationBase.rootNavigatorRef = new WeakRef(this);

        window.addEventListener('popstate', this.popStateListener);
    }

    destructor() {
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        const isRoot = rootNavigator?.routerId === this.routerId;
        if (isRoot)
            NavigationBase.rootNavigatorRef = null;
        window.removeEventListener('popstate', this.popStateListener);
    }

    get routerId() {
        return this._routerId;
    }

    private popStateListener = (e: Event) => {
        const routerId = this._routerId;
        const historyRouterId = this.history.state.get<number>('routerId');
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        const isRoot = rootNavigator?.routerId === this.routerId;
        if ((this.history.state.get<number>('routerId') === null && isRoot)
            || this.history.state.get<number>('routerId') === this._routerId
        ) {
            this.onPopState(e);
        }
    }

    public prefetchRoute(path: string) {
        return this.routerData.prefetchRoute(path);
    }

    abstract onPopState(e: Event): void;

    abstract navigate(route: string, routeParams?: {[key:string]: any}, options?: NavigateOptions): void;

    abstract goBack(options?: GoBackOptions): void;

    protected get dispatchEvent() {
        return this.routerData.dispatchEvent;
    }

    get paramsDeserializer(): ParamsDeserializer | undefined {
        return this.routerData.paramsDeserializer;
    }

    get paramsSerializer(): ParamsSerializer | undefined {
        return this.routerData.paramsSerializer;
    }

    get history() {
        return this._history;
    }

    get metaData() {
        return this._metaData;
    }
    
    abstract get location(): Location;

    private get isInDocument() {
        return Boolean(document.getElementById(`${this.routerId}`));
    }
}