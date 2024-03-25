import { ParamsDeserializer, ParamsSerializer, PlainObject, RouterEventMap } from "./common/types";
import { HistoryEntry } from "./HistoryEntry";
import { MetaData } from "./MetaData";
import { RouterData } from "./RouterData";
import { ScreenBaseProps } from "./ScreenBase";

export interface BackEventDetail {
    routerId: string;
    signal: AbortSignal;
    finished: Promise<void>;
}

export interface NavigationProps<Params extends PlainObject = {}, Config extends ScreenBaseProps["config"] = {}> {
    params?: Params;
    config?: Config;
}

export interface NavigateEventDetail<Params extends PlainObject = {}, Config extends ScreenBaseProps["config"] = {}> {
    routerId: string;
    route: string;
    props: NavigationProps<Params, Config>;
    type: NavigateOptions["type"];
    signal: AbortSignal;
    finished: Promise<void>;
}

export type NavigateEvent = CustomEvent<NavigateEventDetail>;
export type BackEvent = CustomEvent<BackEventDetail>;

export interface NavigationOptions {
    signal?: AbortSignal;
}

export interface NavigateOptions extends NavigationOptions {
    type?: "push" | "replace";
    hash?: string;
}

export interface GoBackOptions extends NavigationOptions { }

export abstract class NavigationBase {
    protected readonly routerData: RouterData;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    protected readonly _routerId: string;
    private _metaData = new MetaData();
    protected readonly _disableBrowserRouting: boolean;
    protected _currentParams: PlainObject = {};
    protected _entries: HistoryEntry[] = new Array<HistoryEntry>();
    private _baseURL: URL;

    constructor(
        _routerId: string,
        _routerData: RouterData,
        _disableBrowserRouting: boolean = false,
        _baseURL: URL | null = null,

    ) {
        _baseURL = _baseURL || new URL(window.location.toString());
        this._baseURL = _baseURL;
        this.routerData = _routerData;
        this._disableBrowserRouting = _disableBrowserRouting;
        this._routerId = _routerId;
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        if (!rootNavigator || !rootNavigator.isInDocument)
            NavigationBase.rootNavigatorRef = new WeakRef(this);
    }

    addEventListener<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) {
        this.routerData.addEventListener?.(type, listener, options);
        return () => this.routerData.removeEventListener?.(type, listener, options);
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

    get baseURL() {
        return this._baseURL;
    }

    get entries() {
        return this._entries;
    }

    get length() {
        return this.entries.length;
    }

    get isEmpty() {
        return !this._entries.length ? true : false;
    }

    abstract get canGoBack(): boolean;
    abstract get canGoForward(): boolean;
    abstract get next(): HistoryEntry | null;
    abstract get current(): HistoryEntry;
    abstract get previous(): HistoryEntry | null;

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
    abstract get committed(): Promise<void>;

    abstract navigate<T extends PlainObject = PlainObject>(route: string, props?: NavigationProps<T>, options?: NavigateOptions): void;

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

    get metaData() {
        return this._metaData;
    }

    private get isInDocument() {
        return Boolean(document.getElementById(`${this.routerId}`));
    }
}