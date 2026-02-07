import {
  Component,
  RefObject,
  Suspense,
  cloneElement,
  createRef,
  isValidElement
} from 'react';
import { ScreenTransitionProvider } from './ScreenTransitionProvider';
import {
  AnimationEffectFactory,
  EventHandler,
  LazyExoticComponent,
  PlainObject,
  RoutePropBase,
  isLazyExoticComponent,
  isNativeLazyExoticComponent
} from './common/types';
import { NestedRouterContext, RouterContext } from './RouterContext';
import { RoutePropContext } from './RoutePropContext';
import { NavigationBase } from './NavigationBase';
import { SharedElementSceneContext } from './SharedElementSceneContext';
import { SharedElementScene } from './SharedElementScene';

export interface ScreenBaseComponentProps<
    R extends RoutePropBase = RoutePropBase,
    N extends NavigationBase = NavigationBase
> {
  readonly route: R;
  readonly navigation: N;
}

export type LifecycleProps<
  R extends RoutePropBase,
  N extends NavigationBase = NavigationBase
> = ({
    signal: AbortSignal;
    preloading: false;
  } & ScreenBaseComponentProps<R, N>)
  | ({
    signal?: AbortSignal;
    preloading: true;
  } & Omit<ScreenBaseComponentProps<R, N>, 'route'>
    & {
        route: Omit<
          ScreenBaseComponentProps<R, N>['route'],
          'setParams' | 'setConfig'
        >
      });

export interface ScreenBaseConfig<
  R extends RoutePropBase = RoutePropBase,
  N extends NavigationBase = NavigationBase
> {
  readonly header?: {
      fallback?: React.ReactNode;
      component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
  };
  readonly footer?: {
      fallback?: React.ReactNode;
      component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
  };
  readonly animation?: AnimationEffectFactory;
  readonly onEnter?: (props: LifecycleProps<R, N>) => void | Promise<void>;
  readonly onExit?: (props: LifecycleProps<R, N>) => void | Promise<void>;
  readonly onEntered?: (props: LifecycleProps<R, N>) => void | Promise<void>;
  readonly onExited?: (props: LifecycleProps<R, N>) => void | Promise<void>;
  readonly onLoad?: (props: LifecycleProps<R, N>) => void | Promise<void>;
}

export interface ScreenBaseProps {
  path: string;
  component: React.JSXElementConstructor<any> | LazyExoticComponent<any>;
  fallback?: React.ReactNode;
  name?: string;
  defaultParams?: PlainObject;
  caseSensitive?: boolean;
  config?: ScreenBaseConfig;
}

export interface ScreenBaseState<
  C extends ScreenBaseProps['config'] = ScreenBaseProps['config'],
  P extends PlainObject = PlainObject
> {
  focused: boolean;
  config: C;
  params: P;
}

export abstract class ScreenBase<
  P extends ScreenBaseProps = ScreenBaseProps,
  S extends ScreenBaseState<P['config']> = ScreenBaseState<P['config']>,
  R extends RoutePropBase<P['config']> = RoutePropBase<P['config']>
> extends Component<P, S> implements EventHandler {
  public readonly sharedElementScene: SharedElementScene;
  readonly #transitionProvider = createRef<ScreenTransitionProvider>();
  protected abstract readonly ref: RefObject<HTMLElement | null>;
  protected readonly nestedRouterData;
  public static readonly contextType = RouterContext;
  public declare context: React.ContextType<typeof RouterContext>;

  public state: S = {
    focused: false,
    config: {},
    params: {},
  } as S;

  constructor(props: P, context: React.ContextType<typeof RouterContext>) {
    super(props);

    this.sharedElementScene = new SharedElementScene(
      `${this.name}-shared-element-scene`
    );
    this.sharedElementScene.getScreenRect = () => {
      return this.ref.current?.getBoundingClientRect() || new DOMRect();
    };
    this.nestedRouterData = {
      parentScreen: this as ScreenBase,
      parentRouter: context,
    };
  }

  public handleEvent(e: Event) {
    const key = `on${e.type}` as keyof this;

    const self = this as {
      [K in typeof key]?: (e: Event) => void;
    };

    self[key]?.(e);
  }

  protected setParams(newParams: PlainObject) {
    this.setState(({ params }) => ({ params: { ...params, ...newParams } }));
  }

  protected setConfig(newConfig: R['config']) {
    this.setState(({ config }) => ({ config: { ...config, ...newConfig } }));
  }

  public get focused() {
    return this.state.focused;
  }

  public get name() {
    if (this.props.name)
      return this.props.name
        .toLowerCase()
        .replace(/[^\w-]/g, '-') // Remove non-alphanumeric chars
        .replace(/-+/g, '-') // Replace multiple hyphens with a single one
        .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens;
    else if (isLazyExoticComponent(this.props.component))
      return this.props.component.module?.default.name.toLowerCase();
    return this.props.component.name.toLowerCase();
  }

  public blur() {
    return new Promise<void>(resolve => {
      this.setState({ focused: false }, resolve);
    });
  }

  public focus() {
    return new Promise<void>(resolve => {
      this.setState({ focused: true }, resolve);
    });
  }

  public async load(signal: AbortSignal) {
    const Component = this.props.component;
    const HeaderComponent = this.props.config?.header?.component;
    const FooterComponent = this.props.config?.footer?.component;
    let result;

    if (isLazyExoticComponent(Component)) {
      result = await Component.load();
    } else {
      result = { default: Component };
    }

    if (isLazyExoticComponent(HeaderComponent))
      await HeaderComponent.load();
    if (isLazyExoticComponent(FooterComponent))
      await FooterComponent.load();

    const navigation = this.context.navigation;
    const route = this.routeProp;
    const preloading = false;
    await this.props
      .config
      ?.onLoad
      ?.({ navigation, route, signal, preloading }); // TODO: prevent passing setConfig and setParams in lifecycle props

    return result;
  }

    protected abstract get routeProp(): R;
    public abstract get config(): R['config'];
    public abstract get params(): R['params'];
    public abstract get resolvedPathname(): string;
    public abstract get id(): string;
    public abstract get viewTransitionName(): string;

    public async onExited(signal: AbortSignal): Promise<void> {
      await this.routeProp.config.onExited?.({
        route: this.routeProp,
        navigation: this.context.navigation,
        preloading: false,
        signal,
      });
    }

    public async onExit(signal: AbortSignal): Promise<void> {
      await this.routeProp.config.onExit?.({
        route: this.routeProp,
        navigation: this.context.navigation,
        preloading: false,
        signal,
      });
    }

    public async onEnter(signal: AbortSignal): Promise<void> {
      await this.routeProp.config.onEnter?.({
        route: this.routeProp,
        navigation: this.context.navigation,
        preloading: false,
        signal,
      });
    }

    public async onEntered(signal: AbortSignal): Promise<void> {
      await this.routeProp.config.onEntered?.({
        route: this.routeProp,
        navigation: this.context.navigation,
        preloading: false,
        signal,
      });
    }

    public get path() {
      return this.props.path;
    }

    public get transitionProvider() {
      return this.#transitionProvider;
    }

    public render() {
      const navigation = this.context.navigation;
      const routeProp = this.routeProp;
      const Component = this.props.component;
      const HeaderComponent = routeProp.config.header?.component;
      const FooterComponent = routeProp.config.footer?.component;

      return (
        <ScreenTransitionProvider
          ref={this.#transitionProvider}
          screenElementRef={this.ref}
          viewTransitionName={this.viewTransitionName}
          animation={routeProp.config.animation}
        >
          <SharedElementSceneContext.Provider value={this.sharedElementScene}>
            <RoutePropContext.Provider value={routeProp}>
              <NestedRouterContext.Provider value={this.nestedRouterData}>
                <Suspense fallback={(
                  <ComponentWithRouteProps
                    component={routeProp.config.header?.fallback}
                    route={routeProp}
                    navigation={navigation}
                  />
                )}>
                  <ComponentWithRouteProps
                    component={HeaderComponent}
                    route={routeProp}
                    navigation={navigation}
                  />
                </Suspense>
                <Suspense fallback={(
                  <ComponentWithRouteProps
                    component={this.props.fallback}
                    route={routeProp}
                    navigation={navigation}
                  />
                )}>
                  <ComponentWithRouteProps
                    component={Component}
                    route={routeProp}
                    navigation={navigation}
                  />
                </Suspense>
                <Suspense
                  fallback={(
                    <ComponentWithRouteProps
                      component={routeProp.config.footer?.fallback}
                      route={routeProp}
                      navigation={navigation}
                    />
                  )}>
                  <ComponentWithRouteProps
                    component={FooterComponent}
                    route={routeProp}
                    navigation={navigation}
                  />
                </Suspense>
              </NestedRouterContext.Provider>
            </RoutePropContext.Provider>
          </SharedElementSceneContext.Provider>
        </ScreenTransitionProvider>
      );
    }
}

interface ComponentWithRoutePropsProps extends ScreenBaseComponentProps<
  RoutePropBase,
  NavigationBase
> {
  component: React.JSXElementConstructor<any>
    | LazyExoticComponent<any> | React.ReactNode;
}
function ComponentWithRouteProps(
  { component, route, navigation }: ComponentWithRoutePropsProps
) {
  if (isLazyExoticComponent(component) && component.module?.default) {
    component = component.module.default;
  }
  const Component = component ?? null;
  if (
    typeof Component === 'function'
    || isNativeLazyExoticComponent(Component)
  ) {
    return (
      <Component
        navigation={navigation}
        route={route}
      />
    );
  } else if (isValidElement(Component)) {
    return cloneElement<any>(Component, {
      navigation,
      route,
    });
  }
  return <>{Component}</>;
}