import { LAST_INDEX } from './common/constants';
import { LoadEvent } from './common/events';
import { historyEntryFromDestination } from './common/utils';
import { MetaData } from './MetaData';

export interface NavigationBaseConfig {
  addEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (
        this: HTMLElement,
        ev: HTMLElementEventMap[K]
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
  removeEventListener<K extends keyof HTMLElementEventMap>(
      type: K,
      listener: (
        this: HTMLElement,
        ev: HTMLElementEventMap[K]
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

export abstract class NavigationBase {
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

  constructor(config: NavigationBaseConfig) {
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

  protected preload(
    route: string,
    state?: unknown
  ): NavigationResult {
    const url = new URL(route, this.baseURL).href;
    const destination: NavigationDestination = {
      getState() {
        return state;
      },
      index: LAST_INDEX,
      sameDocument: true,
      url,
      id: null,
      key: null,
    };
    const loadEvent = new LoadEvent('preload', { destination });
    window.navigation.dispatchEvent(loadEvent);

    const entry = historyEntryFromDestination(destination);
    return {
      finished: loadEvent.transition.finished.then(() => entry),
      committed: Promise.resolve(entry),
    };
  }

  private get isInDocument() {
    return Boolean(document.getElementById(`${this.routerId}`));
  }
}