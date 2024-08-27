import { Component, ElementType, Suspense, cloneElement, createRef, isValidElement } from "react";
import { ScreenTransitionProvider } from "./ScreenTransitionProvider";
import {
    AnimationEffectFactory,
    LazyExoticComponent,
    PlainObject,
    RoutePropBase,
    ScreenBaseFocusOptions,
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

export interface LifecycleProps<R extends RoutePropBase, N extends NavigationBase = NavigationBase> extends ScreenBaseComponentProps<R, N> {
    signal: AbortSignal;
}

export interface ScreenBaseConfig<R extends RoutePropBase = RoutePropBase, N extends NavigationBase = NavigationBase> {
    header?: {
        fallback?: React.ReactNode;
        component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
    };
    footer?: {
        fallback?: React.ReactNode;
        component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
    };
    animation?: AnimationEffectFactory;
    onEnter?: (props: LifecycleProps<R, N>) => void | Promise<void>;
    onExit?: (props: LifecycleProps<R, N>) => void | Promise<void>;
    onEntered?: (props: LifecycleProps<R, N>) => void | Promise<void>;
    onExited?: (props: LifecycleProps<R, N>) => void | Promise<void>;
    onLoad?: (props: LifecycleProps<R, N>) => void | Promise<void>;
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

export interface ScreenBaseState<C extends ScreenBaseProps["config"] = ScreenBaseProps["config"], P extends PlainObject = PlainObject> {
    focused: boolean;
    config: C;
    params: P;
    elementType: ElementType;
}

export abstract class ScreenBase<
    P extends ScreenBaseProps = ScreenBaseProps,
    S extends ScreenBaseState<P["config"]> = ScreenBaseState<P["config"]>,
    R extends RoutePropBase<P["config"]> = RoutePropBase<P["config"]>
> extends Component<P, S> {
    public readonly sharedElementScene: SharedElementScene;
    #transitionProvider = createRef<ScreenTransitionProvider>();
    protected readonly ref = createRef<HTMLDivElement>();
    protected readonly nestedRouterData;
    static readonly contextType = RouterContext;
    declare context: React.ContextType<typeof RouterContext>;

    state: S = {
        focused: false,
        config: {},
        params: {},
        elementType: 'div'
    } as S;

    constructor(props: P, context: React.ContextType<typeof RouterContext>) {
        super(props);

        this.sharedElementScene = new SharedElementScene(`${this.name}-shared-element-scene`);
        this.sharedElementScene.getScreenRect = () => this.ref.current?.getBoundingClientRect() || new DOMRect();
        this.nestedRouterData = { parentScreen: this as ScreenBase, parentRouter: context };
    }

    protected setParams(newParams: PlainObject) {
        this.setState(({ params }) => ({ params: { ...params, ...newParams } }));
    }

    protected setConfig(newConfig: R['config']) {
        this.setState(({ config }) => ({ config: { ...config, ...newConfig } }));
    }

    get focused() {
        return this.state.focused;
    }

    get name() {
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

    protected abstract get routeProp(): R;
    abstract get config(): R["config"];
    abstract get params(): R["params"];
    abstract get resolvedPathname(): string;
    abstract get id(): string;

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
                id={`${this.context.id}-${this.name}-transition-provider`}
                animation={routeProp.config.animation}
                navigation={navigation}
                focused={this.state.focused}
            >
                <div
                    id={`${this.context.id}-${this.name}`}
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
    if (typeof Component === "function" || isNativeLazyExoticComponent(Component)) {
        return (
            <Component
                navigation={navigation}
                route={route}
            />
        );
    } else if (isValidElement(Component)) {
        return cloneElement<any>(Component, {
            navigation,
            route
        });
    }
    return <>{Component}</>;
}