import { createContext } from 'react';
import { ScreenBaseProps, ScreenBase } from './ScreenBase';
import { prefetchRoute } from './common/utils';
import { PlainObject, RouteProp, RouterEventMap, SearchParamsDeserializer, SearchParamsSerializer } from './common/types';
import { NavigationBase } from './NavigationBase';
import { RouterBase } from './RouterBase';
import { ScrollRestorationData } from './ScrollRestorationData';

export type RoutesData = Map<string | undefined, RouteProp<ScreenBaseProps["config"], PlainObject>>;

export class RouterData<N extends NavigationBase = NavigationBase> {
    private routerInstance: RouterBase;
    private _parentRouterData: RouterData<NavigationBase> | null = null;
    private _childRouterData: WeakRef<RouterData<NavigationBase>> | null = null;
    private _dispatchEvent: ((event: Event) => Promise<boolean>) | null = null;
    private _addEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void) | null = null;
    private _removeEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined) => void) | null = null;
    private _routesData: RoutesData = new Map();
    private static _scrollRestorationData = new ScrollRestorationData();
    private _navigation?: N;
    private _backNavigating: boolean = false;
    private _gestureNavigating: boolean = false;
    private _paramsSerializer?: SearchParamsSerializer;
    private _paramsDeserializer?: SearchParamsDeserializer;
    private _currentScreen: ScreenBase | null = null;
    private _nextScreen: ScreenBase | null = null;

    constructor(routerInstance: RouterBase) {
        this.routerInstance = routerInstance;
    }

    public prefetchRoute(path: string): Promise<boolean> {
        return prefetchRoute(path, this);
    }

    set parentRouterData(parentRouterData: RouterData<NavigationBase> | null) {
        this._parentRouterData = parentRouterData;
        if (this._parentRouterData) {
            this._parentRouterData.childRouterData = this;
        }
    }

    set childRouterData(childRouterData: RouterData<NavigationBase> | null) {
        const currentChildRouterData = this._childRouterData?.deref();
        if (
            currentChildRouterData
            && childRouterData?.routerId !== currentChildRouterData?.routerId
        ) {
            throw new Error("It looks like you have two navigators at the same level. Try simplifying your navigation structure by using a nested router instead.");
        }
        if (childRouterData)
            this._childRouterData = new WeakRef(childRouterData);
        else
            this._childRouterData = null;
    }

    set dispatchEvent(_dispatchEvent: ((event: Event) => Promise<boolean>) | null) {
        this._dispatchEvent = _dispatchEvent;
    }

    set addEventListener(_addEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void) | null) {
        this._addEventListener = _addEventListener;
    }

    set removeEventListener(_removeEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined) => void) | null) {
        this._removeEventListener = _removeEventListener;
    }

    set routesData(_routesData: RoutesData) {
        this._routesData = _routesData;
    }
    set navigation(_navigation: N) {
        this._navigation = _navigation;
    }
    set backNavigating(_backNavigating: boolean) {
        this._backNavigating = _backNavigating;
    }
    set gestureNavigating(_gestureNavigating: boolean) {
        this._gestureNavigating = _gestureNavigating;
    }
    set paramsSerializer(_paramsSerializer: ((params: PlainObject) => string) | undefined) {
        this._paramsSerializer = _paramsSerializer;
    }
    set paramsDeserializer(_paramsDeserializer: ((queryString: string) => PlainObject) | undefined) {
        this._paramsDeserializer = _paramsDeserializer;
    }
    set currentScreen(_currentScreen: ScreenBase | null) {
        this._currentScreen = _currentScreen;
    }
    set nextScreen(_nextScreen: ScreenBase | null) {
        this._nextScreen = _nextScreen;
    }

    get currentScreen() {
        return this._currentScreen;
    }
    get nextScreen() {
        return this._nextScreen;
    }
    get routerId() {
        return this.routerInstance.id;
    }
    get routes() {
        return this.routerInstance.props.children;
    }
    get parentRouterData() {
        return this._parentRouterData;
    }
    get childRouterData() {
        return this._childRouterData?.deref() ?? null;
    }
    get dispatchEvent() {
        return this._dispatchEvent;
    }
    get addEventListener() {
        return this._addEventListener;
    }
    get removeEventListener() {
        return this._removeEventListener;
    }
    get routesData() {
        return this._routesData;
    }
    get scrollRestorationData() {
        return RouterData._scrollRestorationData;
    }
    get navigation(): N {
        return this._navigation!;
    }
    get backNavigating() {
        return this._backNavigating;
    }
    get gestureNavigating() {
        return this._gestureNavigating;
    }
    get paramsSerializer(): ((params: PlainObject) => string) | undefined {
        return this._paramsSerializer;
    }
    get paramsDeserializer(): ((queryString: string) => PlainObject) | undefined {
        return this._paramsDeserializer;
    }
}

export const RouterDataContext = createContext<RouterData | null>(null);