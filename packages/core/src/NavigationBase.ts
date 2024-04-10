import { ParamsDeserializer, ParamsSerializer, PlainObject, RouterEventMap } from "./common/types";
import { MetaData } from "./MetaData";
import { RouterData } from "./RouterData";
import { ScreenBaseProps } from "./ScreenBase";

export interface NavigationBaseProps<Params extends PlainObject = {}, Config extends ScreenBaseProps["config"] = {}> {
    params?: Params;
    config?: Config;
}

export interface NavigationBaseOptions {
    signal?: AbortSignal;
}

export abstract class NavigationBase {
    protected readonly routerData: RouterData;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    public readonly metaData = new MetaData();

    constructor(_routerData: RouterData) {
        this.routerData = _routerData;
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

    dispatchEvent(event: Event) {
        return this.routerData.dispatchEvent?.(event);
    }

    get parent(): NavigationBase | null {
        return this.routerData.routerInstance.parentRouterData?.navigation ?? null;
    }

    get routerId() {
        return this.routerData.routerId;
    }

    get baseURL() {
        return this.routerData.baseURL;
    }

    get baseURLPattern() {
        return this.routerData.baseURLPattern;
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

    public preloadRoute(path: string) {
        return this.routerData.preloadRoute(path);
    }

    get paramsDeserializer(): ParamsDeserializer | undefined {
        return this.routerData.paramsDeserializer;
    }

    get paramsSerializer(): ParamsSerializer | undefined {
        return this.routerData.paramsSerializer;
    }

    private get isInDocument() {
        return Boolean(document.getElementById(`${this.routerId}`));
    }
}