import { ParamsDeserializer, ParamsSerializer, PlainObject, RouterEventMap } from "./common/types";
import HistoryBase from "./HistoryBase";
import MetaData from "./MetaData";
import RouterData from "./RouterData";

export interface BackEventDetail {
    routerId: string;
    replace: boolean;
    signal: AbortSignal;
    finished: Promise<void>;
}

export interface NavigateEventDetail {
    routerId: string;
    route: string;
    routeParams?: any;
    replace: boolean;
    signal: AbortSignal;
    finished: Promise<void>;
}

export type NavigateEvent = CustomEvent<NavigateEventDetail>;
export type BackEvent = CustomEvent<BackEventDetail>;

export interface NavigationOptions {
    replace?: boolean;
    signal?: AbortSignal;
}

export interface NavigateOptions extends NavigationOptions {
    hash?: string;
}

export interface GoBackOptions extends NavigationOptions {}

export default abstract class NavigationBase {
    protected readonly routerData: RouterData;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    protected readonly _routerId: string;
    private _metaData = new MetaData();
    protected abstract _history: HistoryBase;
    protected readonly _disableBrowserRouting: boolean;
    protected _currentParams: PlainObject = {};

    constructor(_routerId: string, _routerData: RouterData, _disableBrowserRouting: boolean = false, _defaultRoute: string | null = null) {
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

    addEventListener<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void {
        this.routerData.addEventListener?.(type, listener, options);
    }

    removeEventListener<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void {
        return this.routerData.removeEventListener?.(type, listener, options);
    }

    abstract get parent(): NavigationBase | null;

    get disableBrowserRouting() {
        return this._disableBrowserRouting;
    }

    get routerId() {
        return this._routerId;
    }

    canGoBack() {
        return this.history.canGoBack();
    }

    private popStateListener = (e: Event) => {
        const routerId = this._routerId;
        const historyRouterId = this.history.state.get<string>('routerId');
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        const isRoot = rootNavigator?.routerId === this.routerId;
        if ((this.history.state.get<string>('routerId') === null && isRoot)
            || this.history.state.get<string>('routerId') === this._routerId
        ) {
            this.onPopState(e);
        }
    }

    public getNavigatorById(routerId: string, target?: NavigationBase) {
        const navigator = target ?? NavigationBase.rootNavigatorRef?.deref();
        if (navigator!.routerId === routerId) {
            return navigator;
        } else if (navigator!.routerData.childRouterData) {
            this.getNavigatorById(routerId, navigator!.routerData.childRouterData.navigation);
        } else {
            return null;
        }
    }

    public prefetchRoute(path: string) {
        return this.routerData.prefetchRoute(path);
    }

    abstract get finished(): Promise<void>;

    abstract onPopState(e: Event): void;

    abstract navigate<T extends PlainObject = PlainObject>(route: string, routeParams?: T, options?: NavigateOptions): void;

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