import { Component, ElementType, Suspense, cloneElement, createRef, isValidElement } from "react";
import { ScreenTransitionProvider } from "./ScreenTransitionProvider";
import {
    AnimationEffectFactory,
    LazyExoticComponent,
    PlainObject,
    RouteData,
    SwipeDirection,
    isValidComponentConstructor
} from "./common/types";
import { NestedRouterContext, RouterContext } from "./RouterContext";
import { RouteDataContext } from "./RouteData";
import { NavigationBase } from "./NavigationBase";
import { RouterBase } from "./RouterBase";
import { SharedElementSceneContext } from "./SharedElementSceneContext";
import { SharedElementScene } from "./SharedElementScene";

interface LifecycleProps extends RouteProps<ScreenBaseProps, NavigationBase> {
    signal: AbortSignal;
}

export interface RouteProps<P extends ScreenBaseProps, N extends NavigationBase> {
    route: RouteData<P, PlainObject>;
    navigation: N;
}

export interface ScreenBaseProps {
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
        swipeDirection?: SwipeDirection;
        swipeAreaWidth?: number;
        minFlingVelocity?: number;
        hysteresis?: number;
        disableDiscovery?: boolean;
        onEnter?: (props: LifecycleProps) => void | Promise<void>;
        onExit?: (props: LifecycleProps) => void | Promise<void>;
        onEntered?: (props: LifecycleProps) => void | Promise<void>;
        onExited?: (props: LifecycleProps) => void | Promise<void>;
        onLoad?: (props: LifecycleProps) => void | Promise<void>;
    }
}

export interface ScreenBaseState {
    focused: boolean;
}

export abstract class ScreenBase<P extends ScreenBaseProps = ScreenBaseProps, S extends ScreenBaseState = ScreenBaseState> extends Component<P, S> {
    public readonly sharedElementScene: SharedElementScene;
    private _screenTransitionProvider = createRef<ScreenTransitionProvider>();
    protected ref: HTMLElement | null = null;
    protected elementType: ElementType | string = "div";
    static readonly contextType = RouterContext;
    context!: React.ContextType<typeof RouterContext>;

    state: S = {
        focused: false
    } as S;

    constructor(props: P) {
        super(props);

        this.sharedElementScene = new SharedElementScene(`${this.id}-shared-element-scene`);
    }

    protected setParams(params: PlainObject) {
        params = {
            ...this.routeData.params,
            ...params
        };
        const config = this.routeData.config;
        this.context!.routesData.set(this.props.path, { config, params });
        this.forceUpdate();
    }

    protected setConfig(config: P['config']) {
        config = {
            ...this.routeData.config,
            ...config
        };
        const params = this.routeData.params;
        this.context!.routesData.set(this.props.path, { config, params });
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

        const navigation = this.context!.navigation;
        const route = this.routeData;
        await this.props.config?.onLoad?.({ navigation, route, signal });

        return result;
    }

    get routeData(): RouteData<this["props"]> {
        const focused = this.state.focused;
        const resolvedPathname = this.props.resolvedPathname;
        const setConfig = this.setConfig.bind(this);
        const setParams = this.setParams.bind(this);
        const path = this.props.path;
        return {
            path,
            params: {
                ...this.props.defaultParams,
                ...this.context!.routesData.get(this.props.path)?.params
            },
            config: {
                ...this.props.config,
                ...this.context!.routesData.get(this.props.path)?.config as Partial<NonNullable<this["props"]["config"]>>
            },
            focused,
            resolvedPathname,
            setConfig,
            setParams
        };
    }

    get nestedRouterData() {
        return { parentScreen: this as ScreenBase, parentRouter: this.context! };
    }

    onExited(signal: AbortSignal) {
        return this.routeData.config.onExited?.({
            route: this.routeData,
            navigation: this.context!.navigation,
            signal
        });
    }

    onExit(signal: AbortSignal) {
        return this.routeData.config.onExit?.({
            route: this.routeData,
            navigation: this.context!.navigation,
            signal
        });
    }

    onEnter(signal: AbortSignal) {
        return this.routeData.config.onEnter?.({
            route: this.routeData,
            navigation: this.context!.navigation,
            signal
        });
    }

    onEntered(signal: AbortSignal) {
        return this.routeData.config.onEntered?.({
            route: this.routeData,
            navigation: this.context!.navigation,
            signal
        });
    }

    private onRef = (ref: HTMLElement | null) => {
        if (this.ref !== ref) {
            this.ref = ref;
        }
        this.sharedElementScene.getScreenRect = () => this.ref?.getBoundingClientRect() || new DOMRect();
    }

    get resolvedPathname() {
        return this.props.resolvedPathname;
    }

    get path() {
        return this.props.path;
    }

    get screenTransitionProvider() {
        return this._screenTransitionProvider.current;
    }

    render() {
        const routeData = this.routeData;
        const Component = this.props.component;
        const HeaderComponent = routeData.config.header?.component;
        const FooterComponent = routeData.config.footer?.component;

        return (
            <ScreenTransitionProvider
                ref={this._screenTransitionProvider}
                renderAs={this.elementType}
                id={`${this.id}-animation-provider`}
                animation={routeData.config.animation}
                navigation={this.context!.navigation}
            >
                <div
                    id={this.id}
                    ref={this.onRef}
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
                        <RouteDataContext.Provider value={routeData}>
                            <NestedRouterContext.Provider value={this.nestedRouterData}>
                                <Suspense fallback={<ComponentWithRouteProps component={routeData.config.header?.fallback} route={routeData} navigation={this.context!.navigation} />}>
                                    <ComponentWithRouteProps component={HeaderComponent} route={routeData} navigation={this.context!.navigation} />
                                </Suspense>
                                <Suspense fallback={<ComponentWithRouteProps component={this.props.fallback} route={routeData} navigation={this.context!.navigation} />}>
                                    <ComponentWithRouteProps component={Component} route={routeData} navigation={this.context!.navigation} />
                                </Suspense>
                                <Suspense fallback={<ComponentWithRouteProps component={routeData.config.footer?.fallback} route={routeData} navigation={this.context!.navigation} />}>
                                    <ComponentWithRouteProps component={FooterComponent} route={routeData} navigation={this.context!.navigation} />
                                </Suspense>
                            </NestedRouterContext.Provider>
                        </RouteDataContext.Provider>
                    </SharedElementSceneContext.Provider>
                </div>
            </ScreenTransitionProvider>
        );
    }
}

interface ComponentWithRoutePropsProps<P extends ScreenBaseProps> extends RouteProps<P, NavigationBase> {
    component: React.JSXElementConstructor<any> | LazyExoticComponent<any> | React.ReactNode;
}
function ComponentWithRouteProps<P extends ScreenBaseProps>({ component, route, navigation }: ComponentWithRoutePropsProps<P>) {
    const Component = component ?? null;
    if (isValidElement(Component)) {
        return cloneElement<any>(Component, {
            navigation,
            route
        });
    } else if (isValidComponentConstructor(Component)) {
        return (
            <Component
                navigation={navigation}
                route={route}
            />
        );
    }
    return <>{Component}</>;
}