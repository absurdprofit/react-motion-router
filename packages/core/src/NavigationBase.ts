import { ParamsDeserializer, ParamsSerializer, PlainObject, RouterEventMap } from "./common/types";
import { MetaData } from "./MetaData";
import { RouterBase } from "./RouterBase";
import { ScreenBaseProps } from "./ScreenBase";

export interface NavigationBaseProps<Params extends PlainObject = {}, Config extends ScreenBaseProps["config"] = {}> {
    params?: Params;
    config?: Config;
}

export interface NavigationBaseOptions {
    signal?: AbortSignal;
}

export abstract class NavigationBase {
    protected readonly router: RouterBase;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    public readonly metaData = new MetaData();

    constructor(router: RouterBase) {
        this.router = router;
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        if (!rootNavigator || !rootNavigator.isInDocument)
            NavigationBase.rootNavigatorRef = new WeakRef(this);
    }

    addEventListener<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) {
        this.router.addEventListener?.(type, listener, options);
        return () => this.router.removeEventListener?.(type, listener, options);
    }

    removeEventListener<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void {
        return this.router.removeEventListener?.(type, listener, options);
    }

    dispatchEvent(event: Event) {
        return this.router.dispatchEvent?.(event);
    }

    get parent(): NavigationBase | null {
        return this.router.parentRouter?.navigation ?? null;
    }

    get routerId() {
        return this.router.id;
    }

    get baseURL() {
        return this.router.baseURL;
    }

    get baseURLPattern() {
        return this.router.baseURLPattern;
    }

    public getNavigatorById(routerId: string) {
        return this.router.getRouterById(routerId)?.navigation ?? null;
    }

    public preloadRoute(path: string) {
        return this.router.preloadRoute(path);
    }

    private get isInDocument() {
        return Boolean(document.getElementById(`${this.routerId}`));
    }
}