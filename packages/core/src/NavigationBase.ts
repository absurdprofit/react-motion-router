import { RouterHTMLElement, RouterBaseEventMap } from "./common/types";
import { MetaData } from "./MetaData";
import { RouterBase } from "./RouterBase";

export abstract class NavigationBase<E extends RouterBaseEventMap = RouterBaseEventMap> {
    protected abstract readonly router: RouterBase;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    public readonly metaData = new MetaData();

    constructor() {
        const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
        if (!rootNavigator || !rootNavigator.isInDocument)
            NavigationBase.rootNavigatorRef = new WeakRef(this);
    }

    addEventListener<K extends keyof E>(type: K, listener: (this: RouterHTMLElement<E>, ev: E[K]) => any, options?: boolean | AddEventListenerOptions): () => void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => void {
        this.router.addEventListener(type, listener, options);
        return () => this.router.removeEventListener(type, listener, options);
    }

    removeEventListener<K extends keyof E>(type: K, listener: (this: RouterHTMLElement<E>, ev: E[K]) => any, options?: boolean | EventListenerOptions | undefined): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        return this.router.removeEventListener(type, listener, options);
    }

    dispatchEvent(event: Event) {
        return this.router.dispatchEvent?.(event);
    }

    get parent(): NavigationBase | null {
        return this.router.parent?.navigation ?? null;
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
        const { pathname } = new URL(path, this.baseURL);
        return this.router.preloadRoute(pathname);
    }

    private get isInDocument() {
        return Boolean(document.getElementById(`${this.routerId}`));
    }
}