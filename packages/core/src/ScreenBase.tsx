import { Component, ElementType, Suspense, cloneElement, createRef, isValidElement } from "react";
import { AnimationProvider } from "./AnimationProvider";
import {
    AnimationEffectFactory,
    LazyExoticComponent,
    PlainObject,
    RouteData,
    SwipeDirection,
    isValidComponentConstructor
} from "./common/types";
import { NestedRouterDataContext, RouterDataContext } from "./RouterData";
import { SharedElementScene, SharedElementSceneContext } from "./SharedElement";
import { RouteDataContext } from "./RouteData";
import { NavigationBase } from "./NavigationBase";

export interface RouteProps<P extends ScreenBaseProps, N extends NavigationBase> {
    route: RouteData<P, PlainObject>;
    navigation: N;
}

export interface ScreenBaseProps {
    out?: boolean;
    in?: boolean;
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
        keepAlive?: boolean;
        swipeDirection?: SwipeDirection;
        swipeAreaWidth?: number;
        minFlingVelocity?: number;
        hysteresis?: number;
        disableDiscovery?: boolean;
        onEnter?: (props: RouteProps<ScreenBaseProps, NavigationBase>) => void | Promise<void>;
        onExit?: (props: RouteProps<ScreenBaseProps, NavigationBase>) => void | Promise<void>;
        onEntered?: (props: RouteProps<ScreenBaseProps, NavigationBase>) => void | Promise<void>;
        onExited?: (props: RouteProps<ScreenBaseProps, NavigationBase>) => void | Promise<void>;
        onLoad?: (props: RouteProps<ScreenBaseProps, NavigationBase>) => void | Promise<void>;
    }
}

export interface ScreenBaseState {
    shouldKeepAlive: boolean;
}

export abstract class ScreenBase<P extends ScreenBaseProps = ScreenBaseProps, S extends ScreenBaseState = ScreenBaseState> extends Component<P, S> {
    public readonly sharedElementScene: SharedElementScene;
    private _animationProvider = createRef<AnimationProvider>();
    protected ref: HTMLElement | null = null;
    protected elementType: ElementType | string = "div";
    static readonly contextType = RouterDataContext;
    context!: React.ContextType<typeof RouterDataContext>;

    constructor(props: P) {
        super(props);

        this.sharedElementScene = new SharedElementScene(`${this.id}-shared-element-scene`);
    }

    state: S = {
        shouldKeepAlive: this.props.out && this.props.config?.keepAlive,
    } as S;

    shouldComponentUpdate(nextProps: P) {
        if (nextProps.out && !nextProps.in) {
            return true;
        }
        if (nextProps.in && !nextProps.out) {
            return true;
        }
        if (nextProps.in !== this.props.in || nextProps.out !== this.props.out) {
            return true;
        }
        return false;
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

    async load() {
        let Component = this.props.component;
        let result;
        if ('load' in Component) {
            result = await Component.load();
        } else {
            result = { default: Component };
        }

        const navigation = this.context!.navigation;
        const route = this.routeData;
        await this.props.config?.onLoad?.({navigation, route});
        
        return result;
    }

    get routeData() {
        const focused = Boolean(this.props.in);
        const resolvedPathname = this.props.resolvedPathname;
        const setConfig = this.setConfig.bind(this);
        const setParams = this.setParams.bind(this);
        const path = this.props.path;
        return {
            path,
            params: {
                ...this.props.defaultParams, // passed as prop
                ...this.context!.routesData.get(this.props.path)?.params // passed by other screens using navigate
            },
            config: {
                ...this.props.config, // passed as prop
                ...this.context!.routesData.get(this.props.path)?.config // passed by other screens using navigate
            },
            focused,
            resolvedPathname,
            setConfig,
            setParams
        };
    }

    get nestedRouterData() {
        return {routeData: this.routeData, routerData: this.context!};
    }

    onExited() {
        return this.routeData.config.onExited?.({
            route: this.routeData,
            navigation: this.context!.navigation
        });
    }

    onExit() {
        return this.routeData.config.onExit?.({
            route: this.routeData,
            navigation: this.context!.navigation
        });
    }

    onEnter() {
        this.sharedElementScene.previousScene = this.context!.currentScreen?.sharedElementScene ?? null;
        return this.routeData.config.onEnter?.({
            route: this.routeData,
            navigation: this.context!.navigation
        });
    }

    onEntered() {
        return this.routeData.config.onEntered?.({
            route: this.routeData,
            navigation: this.context!.navigation
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

    get animationProvider() {
        return this._animationProvider.current;
    }

    render() {
        const routeData = this.routeData;
        const Component = this.props.component;
        const HeaderComponent = routeData.config.header?.component;
        const FooterComponent = routeData.config.footer?.component;

        this.sharedElementScene.keepAlive = Boolean(routeData.config.keepAlive);
        return (
            <AnimationProvider
                ref={this._animationProvider}
                renderAs={this.elementType}
                in={Boolean(this.props.in)}
                out={Boolean(this.props.out)}
                id={`${this.id}-animation-provider`}
                animation={routeData.config.animation}
                keepAlive={this.state.shouldKeepAlive ? Boolean(routeData.config.keepAlive) : false}
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
                            <NestedRouterDataContext.Provider value={this.nestedRouterData}>
                                <Suspense fallback={<ComponentWithRouteData component={routeData.config.header?.fallback} route={routeData} navigation={this.context!.navigation} />}>
                                    <ComponentWithRouteData component={HeaderComponent} route={routeData} navigation={this.context!.navigation} />
                                </Suspense>
                                <Suspense fallback={<ComponentWithRouteData component={this.props.fallback} route={routeData} navigation={this.context!.navigation} />}>
                                    <ComponentWithRouteData component={Component} route={routeData} navigation={this.context!.navigation} />
                                </Suspense>
                                <Suspense fallback={<ComponentWithRouteData component={routeData.config.footer?.fallback} route={routeData} navigation={this.context!.navigation} />}>
                                    <ComponentWithRouteData component={FooterComponent} route={routeData} navigation={this.context!.navigation} />
                                </Suspense>
                            </NestedRouterDataContext.Provider>
                        </RouteDataContext.Provider>
                    </SharedElementSceneContext.Provider>
                </div>
            </AnimationProvider>
        );
    }
}

interface ComponentWithRouteDataProps<P extends ScreenBaseProps> extends RouteProps<P, NavigationBase> {
    component: React.JSXElementConstructor<any> | LazyExoticComponent<any> | React.ReactNode;
}
function ComponentWithRouteData<P extends ScreenBaseProps>({ component, route, navigation }: ComponentWithRouteDataProps<P>) {
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