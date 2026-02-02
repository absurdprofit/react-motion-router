import { NavigationBase } from './NavigationBase';
import { ScreenTransitionLayer } from './ScreenTransitionLayer';
import {
  ScreenChild,
  RouterBaseHTMLElement,
  isLazyExoticComponent,
  isValidScreenChild,
  EventHandler
} from './common/types';
import { NestedRouterContext, RouterContext } from './RouterContext';
import {
  dispatchEvent,
  matchRoute,
  resolveBaseURLFromPattern
} from './common/utils';
import { Component, createRef, Children } from 'react';
import { ScreenBase, ScreenBaseConfig } from './ScreenBase';
import { LoadEvent } from './common/events';

type ScreenType<T> = T extends ScreenChild<infer S> | ScreenChild<infer S>[]
  ? S
  : never;

export interface RouterBaseConfig {
  screenConfig?: ScreenBaseConfig;
  basePath?: string;
}

export interface RouterBaseProps<S extends ScreenBase = ScreenBase> {
  id?: string;
  config?: RouterBaseConfig;
  children: ScreenChild<S> | ScreenChild<S>[];
}

export type RouterBaseState = object;

export abstract class RouterBase<
  P extends RouterBaseProps = RouterBaseProps,
  S extends RouterBaseState = RouterBaseState,
> extends Component<P, S> implements EventHandler {
  protected readonly ref = createRef<RouterBaseHTMLElement>();
  protected screenTransitionLayer = createRef<ScreenTransitionLayer>();
  public abstract readonly navigation: NavigationBase;
  public readonly parent: RouterBase | null = null;
  #child: WeakRef<RouterBase> | null = null;
  private loadDispatched = false;
  private hasUAVisualTransition = false;
  public readonly parentScreen: ScreenBase | null = null;
  private static rootRouterRef: WeakRef<RouterBase> | null = null;
  public static readonly contextType = NestedRouterContext;
  public declare context: React.ContextType<typeof NestedRouterContext>;

  constructor(
    props: P,
    context: React.ContextType<typeof NestedRouterContext>
  ) {
    super(props);

    this.parentScreen = context?.parentScreen ?? null;
    this.parent = context?.parentRouter ?? null;
  }

  private static get events() {
    return Object.getOwnPropertyNames(this.prototype)
      .filter(type => /^on/.test(type))
      .map(type => type.replace('on', ''));
  }

  public componentDidMount() {
    if (this.parent)
      this.parent.child = this;
    else {
      const currentRootRouter = RouterBase.rootRouterRef?.deref();
      if (
        this !== currentRootRouter
        && currentRootRouter?.mounted
      )
        throw new Error('It looks like you have two navigators at the same level. Try simplifying your navigation structure by using a nested router instead.');
        
      else
        RouterBase.rootRouterRef = new WeakRef(this);

      window.navigation.addEventListener(
        'navigate',
        this
      );
    }

    this.#addEventListeners();

    if (!this.loadDispatched) {
      window.navigation.dispatchEvent(new LoadEvent('load'));
      this.loadDispatched = true;
    }
  }

  public componentWillUnmount() {
    this.#removeEventListeners();
    if (this.isRoot) {
      window.navigation.removeEventListener(
        'navigate',
        this
      );
    }
  }

  public onnavigate(e: NavigateEvent) {
    const activeRouters = [...this.#activeRoutersIter()];
    // travel down router tree to find a router that can intercept
    const interceptor = activeRouters.findLast(
      router => router.canIntercept(e)
    );
    if (interceptor) {
      interceptor.intercept(e);
      this.hasUAVisualTransition = e.hasUAVisualTransition;
    }
  };

  #addEventListeners() {
    const Router = this.constructor as typeof RouterBase;
    Router.events.forEach(event => {
      this.ref.current?.addEventListener(event, this);
    });
  }

  #removeEventListeners() {
    const Router = this.constructor as typeof RouterBase;
    Router.events.forEach(event => {
      this.ref.current?.removeEventListener(event, this);
    });
  }

  *#activeRoutersIter(
    target: RouterBase | null = RouterBase.rootRouterRef?.deref() ?? null
  ) {
    let router: RouterBase | null = target;
    while (router) {
      yield router;
      router = router.child;
    }
  }

  public getRouterById(
    routerId: string,
    target?: RouterBase
  ): RouterBase | null {
    const activeRouters = [...this.#activeRoutersIter(target)];
    return activeRouters.find((router) => router.id === routerId) ?? null;
  }

  public dispatchEvent(event: Event) {
    const ref = this.ref.current ?? undefined;
    return dispatchEvent(event, ref);
  }

  public addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (
      this: RouterBaseHTMLElement,
      ev: HTMLElementEventMap[K]
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
    const ref = this.ref.current;
    if (!ref) return () => {};
    ref.addEventListener(type, listener, options);
    return () => ref.removeEventListener(type, listener, options);
  }

  public removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (
      this: RouterBaseHTMLElement,
      ev: HTMLElementEventMap[K]
    ) => void,
    options?: boolean | EventListenerOptions | undefined
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) {
    return this.ref.current?.removeEventListener(type, listener, options);
  }

  public handleEvent(e: Event) {
    const key = `on${e.type}` as keyof this;

    const self = this as {
      [K in typeof key]?: (e: Event) => void;
    };

    self[key]?.(e);
  }

  protected screenChildFromPathname(pathname: string) {
    for (const child of Children.toArray(this.props.children)) {
      if (!isValidScreenChild<ScreenType<P['children']>>(child)) continue;
      const matchInfo = matchRoute(
        child.props.path,
        pathname,
        this.baseURLPattern.pathname,
        child.props.caseSensitive
      );
      if (matchInfo)
        return {
          child ,
          matchInfo,
        };
    }

    return null;
  }

  protected preloadScreen(screen: ScreenChild) {
    const config = screen.props.config;
    const preloadTasks = [];
    if (isLazyExoticComponent(screen.props.component))
      preloadTasks.push(screen.props.component.load());
    if (isLazyExoticComponent(config?.header?.component))
      preloadTasks.push(config?.header?.component.load());
    if (isLazyExoticComponent(config?.footer?.component))
      preloadTasks.push(config?.footer?.component.load());

    return Promise.all(preloadTasks).then(() => { return; });
  }

  public includesRoute(
    pathname: string,
    baseURLPattern: string = window.location.origin
  ) {
    return this.pathPatterns.some(({ pattern, caseSensitive }) => {
      return matchRoute(pattern, pathname, baseURLPattern, caseSensitive);
    });
  }

  public get id(): string {
    if (this.props.id) return this.props.id;
    const prefix = this.parent?.id;
    const id = this.parentScreen?.id ?? 'root';
    return [prefix, id].filter(Boolean).join('-');
  }

  public get isRoot() {
    return !this.parent;
  }

  public get baseURL() {
    const pathname = this.isRoot
      ? window.location.pathname
      : this.parentScreen!.resolvedPathname;
    const pattern = this.baseURLPattern.pathname;

    return resolveBaseURLFromPattern(pattern, pathname)!;
  }

  public get baseURLPattern() {
    let baseURL = window.location.origin + '/';
    let basePath = this.props.config?.basePath;
    if (!basePath) {
      if (this.isRoot) {
        basePath = '/';
      } else {
        basePath = '.';
      }
    }

    if (this.parent && this.parentScreen) {
      const {
        resolvedPathname = window.location.pathname,
        path,
      } = this.parentScreen;
      const parentBaseURL = this.parent.baseURL?.href;
      const pattern = new URLPattern({
        baseURL: parentBaseURL,
        pathname: path, 
      });
      baseURL = resolveBaseURLFromPattern(
        pattern.pathname,
        resolvedPathname
      )!.href;
    }

    return new URLPattern({ baseURL, pathname: basePath });
  }

  public get pathPatterns() {
    return Children.map(this.props.children, (child) => {
      return {
        pattern: child.props.path,
        caseSensitive: Boolean(child.props.caseSensitive),
      };
    });
  }

  public get mounted() {
    return Boolean(this.ref.current);
  }

  public get child() {
    return this.#child?.deref() ?? null;
  }

  public set child(child: RouterBase | null) {
    const currentChildRouter = this.#child?.deref();
    if (
      currentChildRouter
        && child !== currentChildRouter
        && child?.parentScreen?.id === currentChildRouter.parentScreen?.id
        && currentChildRouter.mounted
    ) {
      throw new Error('It looks like you have two navigators at the same level. Try simplifying your navigation structure by using a nested router instead.');
    }
    if (child)
      this.#child = new WeakRef(child);
    else
      this.#child = null;
  }

    protected abstract canIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract shouldIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract intercept(navigateEvent: NavigateEvent): void;
    protected abstract get screens(): P['children'];

    public render() {
      if (!this.navigation) return;
      return (
        <div
          id={this.id}
          className="react-motion-router"
          style={{ width: '100%', height: '100%' }}
          ref={this.ref}
        >
          <RouterContext.Provider value={this}>
            <ScreenTransitionLayer
              id={`${this.id}-transition-layer`}
              ref={this.screenTransitionLayer}
              navigation={this.navigation}
              hasUAVisualTransition={this.hasUAVisualTransition}
            >
              {this.screens}
            </ScreenTransitionLayer>
          </RouterContext.Provider>
        </div>
      );
    }
}