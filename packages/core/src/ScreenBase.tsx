import { Component, ElementType, Suspense, cloneElement, createRef, isValidElement } from "react";
import { ScreenTransitionProvider } from "./ScreenTransitionProvider";
import {
    AnimationEffectFactory,
    LazyExoticComponent,
    PlainObject,
    RoutePropBase,
    isLazyExoticComponent,
    isNativeLazyExoticComponent,
} from "./common/types";
import { NestedRouterContext, RouterContext } from "./RouterContext";
import { RoutePropContext } from "./RoutePropContext";
import { NavigationBase } from "./NavigationBase";
import { SharedElementSceneContext } from "./SharedElementSceneContext";
import { SharedElementScene } from "./SharedElementScene";

export interface ScreenBaseComponentProps<
    R extends RoutePropBase = RoutePropBase,
    N extends NavigationBase = NavigationBase
> {
    route: R;
    navigation: N;
}

export interface LifecycleProps<R extends RoutePropBase> extends ScreenBaseComponentProps<R, NavigationBase> {
    signal: AbortSignal;
}

export interface ScreenBaseProps<R extends RoutePropBase = RoutePropBase> {
    component: React.JSXElementConstructor<any> | LazyExoticComponent<any>;
    fallback?: React.ReactNode;
    path: string;
    resolvedPathname?: string;
    defaultParams?: PlainObject;
    caseSensitive?: boolean;
    id?: string;
    config?: {
        title?: string;
        header?: {
            fallback?: React.ReactNode;
            component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
        };
        footer?: {
            fallback?: React.ReactNode;
            component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
        };
        animation?: AnimationEffectFactory;
        onEnter?: (props: LifecycleProps<R>) => void | Promise<void>;
        onExit?: (props: LifecycleProps<R>) => void | Promise<void>;
        onEntered?: (props: LifecycleProps<R>) => void | Promise<void>;
        onExited?: (props: LifecycleProps<R>) => void | Promise<void>;
        onLoad?: (props: LifecycleProps<R>) => void | Promise<void>;
    }
}

export interface ScreenBaseState {
    focused: boolean;
    elementType: ElementType;
}

export abstract class ScreenBase<P extends ScreenBaseProps = ScreenBaseProps, S extends ScreenBaseState = ScreenBaseState, R extends RoutePropBase<ScreenBaseProps["config"]> = RoutePropBase<ScreenBaseProps["config"]>> extends Component<P, S> {
    public readonly sharedElementScene: SharedElementScene;
    #transitionProvider = createRef<ScreenTransitionProvider>();
    protected readonly ref = createRef<HTMLDivElement>();
    protected readonly nestedRouterData;
    static readonly contextType = RouterContext;
    declare context: React.ContextType<typeof RouterContext>;

    state: S = {
        focused: false,
        elementType: 'div'
    } as S;

    constructor(props: P, context: React.ContextType<typeof RouterContext>) {
        super(props);

        this.sharedElementScene = new SharedElementScene(`${this.id}-shared-element-scene`);
        this.sharedElementScene.getScreenRect = () => this.ref.current?.getBoundingClientRect() || new DOMRect();
        this.nestedRouterData = { parentScreen: this as ScreenBase, parentRouter: context };
    }

    protected setParams(params: PlainObject) {
        params = {
            ...this.routeProp.params,
            ...params
        };
        const config = this.routeProp.config;
        this.context.screenState.set(this.props.path, { config, params });
        this.forceUpdate();
    }

    protected setConfig(config: P['config']) {
        config = {
            ...this.routeProp.config,
            ...config
        };
        const params = this.routeProp.params;
        this.context.screenState.set(this.props.path, { config, params });
        this.forceUpdate();
    }

    get id() {
        if (this.props.id) return this.props.id;
        return this.props.path
            .toLowerCase()
            .replace(/[^\w-]/g, '-') // Remove non-alphanumeric chars
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens;
    }

    get focused() {
        return this.state.focused;
    }

    blur() {
        return new Promise<void>(resolve => this.setState({ focused: false }, resolve));
    }

    focus() {
        return new Promise<void>(resolve => this.setState({ focused: true }, resolve));
    }

    async load(signal: AbortSignal) {
        let Component = this.props.component;
        let result;
        if ('load' in Component) {
            result = await Component.load();
        } else {
            result = { default: Component };
        }

        const navigation = this.context.navigation;
        const route = this.routeProp;
        await this.props.config?.onLoad?.({ navigation, route, signal });

        return result;
    }

    abstract get routeProp(): R;
    abstract get config(): R["config"];
    abstract get params(): R["params"];

    async onExited(signal: AbortSignal): Promise<void> {
        await this.routeProp.config.onExited?.({
            route: this.routeProp,
            navigation: this.context.navigation,
            signal
        });
    }

    async onExit(signal: AbortSignal): Promise<void> {
        await this.routeProp.config.onExit?.({
            route: this.routeProp,
            navigation: this.context.navigation,
            signal
        });
    }

    async onEnter(signal: AbortSignal): Promise<void> {
        await this.routeProp.config.onEnter?.({
            route: this.routeProp,
            navigation: this.context.navigation,
            signal
        });
    }

    async onEntered(signal: AbortSignal): Promise<void> {
        await this.routeProp.config.onEntered?.({
            route: this.routeProp,
            navigation: this.context.navigation,
            signal
        });
    }

    get resolvedPathname() {
        return this.props.resolvedPathname;
    }

    get path() {
        return this.props.path;
    }

    get transitionProvider() {
        return this.#transitionProvider;
    }

    render() {
        const navigation = this.context.navigation;
        const routeProp = this.routeProp;
        const Component = this.props.component;
        const HeaderComponent = routeProp.config.header?.component;
        const FooterComponent = routeProp.config.footer?.component;

        return (
            <ScreenTransitionProvider
                ref={this.#transitionProvider}
                renderAs={this.state.elementType}
                id={`${this.id}-transition-provider`}
                animation={routeProp.config.animation}
                navigation={navigation}
                focused={this.state.focused}
            >
                <div
                    id={this.id}
                    ref={this.ref}
                    className="screen"
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        pointerEvents: 'inherit'
                    }}
                >
                    <SharedElementSceneContext.Provider value={this.sharedElementScene}>
                        <RoutePropContext.Provider value={routeProp}>
                            <NestedRouterContext.Provider value={this.nestedRouterData}>
                                <Suspense fallback={<ComponentWithRouteProps component={routeProp.config.header?.fallback} route={routeProp} navigation={navigation} />}>
                                    <ComponentWithRouteProps component={HeaderComponent} route={routeProp} navigation={navigation} />
                                </Suspense>
                                <Suspense fallback={<ComponentWithRouteProps component={this.props.fallback} route={routeProp} navigation={navigation} />}>
                                    <ComponentWithRouteProps component={Component} route={routeProp} navigation={navigation} />
                                </Suspense>
                                <Suspense fallback={<ComponentWithRouteProps component={routeProp.config.footer?.fallback} route={routeProp} navigation={navigation} />}>
                                    <ComponentWithRouteProps component={FooterComponent} route={routeProp} navigation={navigation} />
                                </Suspense>
                            </NestedRouterContext.Provider>
                        </RoutePropContext.Provider>
                    </SharedElementSceneContext.Provider>
                </div>
            </ScreenTransitionProvider>
        );
    }
}

interface ComponentWithRoutePropsProps extends ScreenBaseComponentProps<RoutePropBase, NavigationBase> {
    component: React.JSXElementConstructor<any> | LazyExoticComponent<any> | React.ReactNode;
}
function ComponentWithRouteProps({ component, route, navigation }: ComponentWithRoutePropsProps) {
    if (isLazyExoticComponent(component) && component.module?.default) {
        component = component.module.default;
    }
    const Component = component ?? null;
    if (isValidElement(Component)) {
        return cloneElement<any>(Component, {
            navigation,
            route
        });
    } else if (typeof Component === "function" || isNativeLazyExoticComponent(Component)) {
        return (
            <Component
                navigation={navigation}
                route={route}
            />
        );
    }
    return <>{Component}</>;
}