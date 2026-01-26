import { RouterHTMLElement, RouterBaseEventMap } from './common/types';
import { MetaData } from './MetaData';
import { RouterBase } from './RouterBase';

export abstract class NavigationBase<
  E extends RouterBaseEventMap = RouterBaseEventMap
  > {
    protected abstract readonly router: RouterBase;
    private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
    public readonly metaData = new MetaData();

    constructor() {
      const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
      if (!rootNavigator || !rootNavigator.isInDocument)
        NavigationBase.rootNavigatorRef = new WeakRef(this);
    }

    public addEventListener<K extends keyof E>(
      type: K,
      listener: (
        this: RouterHTMLElement<E>,
        ev: E[K]
      ) => void,
      options?: boolean | AddEventListenerOptions
    ): () => void;
    public addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): () => void;
    public addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): () => void {
      return this.router.addEventListener(type, listener, options);
    }

    public removeEventListener<K extends keyof E>(
      type: K,
      listener: (
        this: RouterHTMLElement<E>,
        ev: E[K]
      ) => void,
      options?: boolean | EventListenerOptions | undefined
    ): void
    public removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void;
    public removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void {
      return this.router.removeEventListener(type, listener, options);
    }

    public dispatchEvent(event: Event) {
      return this.router.dispatchEvent?.(event);
    }

    public get parent(): NavigationBase | null {
      return this.router.parent?.navigation ?? null;
    }

    public get routerId() {
      return this.router.id;
    }

    public get baseURL() {
      return this.router.baseURL;
    }

    public get baseURLPattern() {
      return this.router.baseURLPattern;
    }

    public getNavigatorById(routerId: string) {
      return this.router.getRouterById(routerId)?.navigation ?? null;
    }

    private get isInDocument() {
      return Boolean(document.getElementById(`${this.routerId}`));
    }
}