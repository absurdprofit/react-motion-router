import { RouterHTMLElement, RouterBaseEventMap } from './common/types';
import { MetaData } from './MetaData';

export interface NavigationBaseConfig<
  E extends RouterBaseEventMap = RouterBaseEventMap
> {
  addEventListener<K extends keyof E>(
      type: K,
      listener: (
        this: RouterHTMLElement<E>,
        ev: E[K]
      ) => void,
      options?: boolean | AddEventListenerOptions
    ): () => void;
  addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): () => void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  removeEventListener<K extends keyof E>(
      type: K,
      listener: (
        this: RouterHTMLElement<E>,
        ev: E[K]
      ) => void,
      options?: boolean | EventListenerOptions | undefined
    ): void
  removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  dispatchEvent(event: Event): Promise<boolean>;
  parent: NavigationBase | null;
  routerId: string;
  baseURL: URL;
  baseURLPattern: URLPattern;
  getNavigatorById(routerId: string): NavigationBase | null;
}

export abstract class NavigationBase<
  E extends RouterBaseEventMap = RouterBaseEventMap
> {
  private static rootNavigatorRef: WeakRef<NavigationBase> | null = null;
  public readonly metaData = new MetaData();
  public readonly addEventListener;
  public readonly removeEventListener;
  public readonly dispatchEvent;
  public readonly parent;
  public readonly routerId;
  public readonly baseURL;
  public readonly baseURLPattern;
  public readonly getNavigatorById;

  constructor(config: NavigationBaseConfig<E>) {
    const rootNavigator = NavigationBase.rootNavigatorRef?.deref();
    if (!rootNavigator || !rootNavigator.isInDocument)
      NavigationBase.rootNavigatorRef = new WeakRef(this);
    this.addEventListener = config.addEventListener;
    this.removeEventListener = config.removeEventListener;
    this.dispatchEvent = config.dispatchEvent;
    this.parent = config.parent;
    this.routerId = config.routerId;
    this.baseURL = config.baseURL;
    this.baseURLPattern = config.baseURLPattern;
    this.getNavigatorById = config.getNavigatorById;
  }

  private get isInDocument() {
    return Boolean(document.getElementById(`${this.routerId}`));
  }
}