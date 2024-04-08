import { createContext } from 'react';
import { preloadRoute } from './common/utils';
import { RouteData, RoutesData, SearchParamsDeserializer, SearchParamsSerializer } from './common/types';
import { NavigationBase } from './NavigationBase';
import { RouterBase } from './RouterBase';
import { ScrollRestorationData } from './ScrollRestorationData';

export class RouterData<N extends NavigationBase = NavigationBase> {
    public readonly routerInstance: RouterBase;
    private _childRouterData: WeakRef<RouterData<NavigationBase>> | null = null;
    public routesData: RoutesData = new Map();
    private static _scrollRestorationData = new ScrollRestorationData();
    public paramsSerializer?: SearchParamsSerializer;
    public paramsDeserializer?: SearchParamsDeserializer;

    constructor(routerInstance: RouterBase) {
        this.routerInstance = routerInstance;
    }

    public preloadRoute(path: string): Promise<boolean> {
        return preloadRoute(path, this);
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

    get currentScreen() {
        return this.routerInstance.state.currentScreen?.current;
    }
    get nextScreen() {
        return this.routerInstance.state.nextScreen?.current;
    }
    get routerId() {
        return this.routerInstance.id;
    }
    get baseURL() {
        return this.routerInstance.baseURL;
    }
    get baseURLPattern() {
        return this.routerInstance.baseURLPattern;
    }
    get routes() {
        return this.routerInstance.props.children;
    }
    get childRouterData() {
        return this._childRouterData?.deref() ?? null;
    }
    get dispatchEvent() {
        return this.routerInstance.dispatchEvent;
    }
    get addEventListener() {
        return this.routerInstance.addEventListener;
    }
    get removeEventListener() {
        return this.routerInstance.removeEventListener;
    }
    get scrollRestorationData() {
        return RouterData._scrollRestorationData;
    }
    get navigation(): N {
        return this.routerInstance.state.navigation as N;
    }
    get backNavigating() {
        return this.routerInstance.state.backNavigating;
    }
}

export const RouterDataContext = createContext<RouterData | null>(null);
export const NestedRouterDataContext = createContext<{routerData: RouterData, routeData: RouteData} | null>(null);
