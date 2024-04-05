import { createContext } from 'react';
import { ScreenBaseProps, ScreenBase } from './ScreenBase';
import { preloadRoute } from './common/utils';
import { PlainObject, RouteProp, RouterEventMap, SearchParamsDeserializer, SearchParamsSerializer } from './common/types';
import { NavigationBase } from './NavigationBase';
import { RouterBase } from './RouterBase';
import { ScrollRestorationData } from './ScrollRestorationData';
import { HistoryEntry } from './HistoryEntry';

export type RoutesData = Map<string | undefined, RouteProp<ScreenBaseProps["config"], PlainObject>>;

export class RouterData<N extends NavigationBase = NavigationBase> {
    public readonly routerInstance: RouterBase;
    private _parentRouterData: RouterData<NavigationBase> | null = null;
    private _childRouterData: WeakRef<RouterData<NavigationBase>> | null = null;
    public routesData: RoutesData = new Map();
    private static _scrollRestorationData = new ScrollRestorationData();
    private _entries = new Array<HistoryEntry>();
    public paramsSerializer?: SearchParamsSerializer;
    public paramsDeserializer?: SearchParamsDeserializer;
    public currentScreen: ScreenBase | null = null;
    public nextScreen: ScreenBase | null = null;

    constructor(routerInstance: RouterBase) {
        this.routerInstance = routerInstance;
    }

    public preloadRoute(path: string): Promise<boolean> {
        return preloadRoute(path, this);
    }

    public addEntry(entry: NavigationHistoryEntry) {
        this._entries.push(new HistoryEntry(entry, this.routerId, this._entries.length));
        entry.ondispose = () => {
            this._entries = this._entries.filter(e => e.key !== entry.key);
        };
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
    get parentRouterData() {
        return this._parentRouterData;
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
    get entries() {
        return [...this._entries];
    }
    get backNavigating() {
        return this.routerInstance.state.backNavigating;
    }
}

export const RouterDataContext = createContext<RouterData | null>(null);