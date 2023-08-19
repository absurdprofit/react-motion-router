import { Component, ElementType, Suspense, cloneElement, isValidElement } from "react";
import AnimationProvider from "./AnimationProvider";
import {
    AnimationConfig,
    AnimationConfigFactory,
    AnimationConfigSet,
    AnimationKeyframeEffectConfig,
    LazyExoticComponent,
    PlainObject,
    ReducedAnimationConfigSet,
    SwipeDirection,
    isValidComponentConstructor
} from "./common/types";
import { RouterDataContext } from "./RouterData";
import { SharedElement, SharedElementScene, SharedElementSceneContext } from "./SharedElement";
import { DEFAULT_ANIMATION } from "./common/utils";
import { RouteDataContext } from "./RouteData";
import { useNavigation, useRoute } from ".";

export interface ScreenBaseProps {
    out?: boolean;
    in?: boolean;
    component: React.JSXElementConstructor<any> | LazyExoticComponent<any>;
    fallback?: React.ReactNode;
    path?: string;
    resolvedPathname?: string;
    defaultParams?: PlainObject;
    name?: string;
    config?: {
        header?: {
            fallback?: React.ReactNode;
            component: React.JSXElementConstructor<any> | LazyExoticComponent<any>
        }
        animation?: ReducedAnimationConfigSet | AnimationConfig | AnimationKeyframeEffectConfig | AnimationConfigFactory;
        pseudoElement?: {
            selector: string;
            animation?: ReducedAnimationConfigSet | AnimationConfig | AnimationKeyframeEffectConfig | AnimationConfigFactory;
        };
        keepAlive?: boolean;
        swipeDirection?: SwipeDirection;
        swipeAreaWidth?: number;
        minFlingVelocity?: number;
        hysteresis?: number;
        disableDiscovery?: boolean;
    }
}

export interface ScreenBaseState {
    shouldKeepAlive: boolean;
}

export default abstract class ScreenBase<P extends ScreenBaseProps = ScreenBaseProps, S extends ScreenBaseState = ScreenBaseState> extends Component<P, S> {
    protected name = this.props.path === undefined ? 'not-found' : this.props.path?.toString().slice(1).replace('/', '-') || 'index';
    protected sharedElementScene: SharedElementScene = new SharedElementScene(this.name);
    protected ref: HTMLElement | null = null;
    private onRef = this.setRef.bind(this);
    private animation: AnimationConfigSet | (() => AnimationConfigSet) = DEFAULT_ANIMATION;
    private pseudoElementAnimation: AnimationConfigSet | (() => AnimationConfigSet) = DEFAULT_ANIMATION;
    protected elementType: ElementType | string = "div";
    protected animationProviderRef: HTMLElement | null = null;
    static contextType = RouterDataContext;
    context!: React.ContextType<typeof RouterDataContext>;

    state: S = {
        shouldKeepAlive: this.props.out && this.props.config?.keepAlive,
    } as S;

    componentDidMount() {
        this.sharedElementScene.getScreenRect = () => this.ref?.getBoundingClientRect() || new DOMRect();
        this.sharedElementScene.keepAlive = this.props.config?.keepAlive || false;
        
        this.animation = this.setupAnimation(this.props.config?.animation) ?? this.context!.animation;
        this.pseudoElementAnimation = this.setupAnimation(this.props.config?.pseudoElement?.animation) ?? DEFAULT_ANIMATION;

        this.context!.mountedScreen = this;
        this.forceUpdate();
    }

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

    componentDidUpdate(prevProps: P) {
        if (prevProps.config?.keepAlive !== this.props.config?.keepAlive) {
            this.sharedElementScene.keepAlive = this.props.config?.keepAlive || false;
        }
    }

    setupAnimation(animation?: ReducedAnimationConfigSet | AnimationConfig | AnimationKeyframeEffectConfig | AnimationConfigFactory) {
        if (animation) {
            if (typeof animation === "function") {
                return this.animationFactory.bind(this, animation);
            } else {
                if ('in' in animation) {
                    return {
                        in: animation.in,
                        out: animation.out || animation.in
                    };
                } else {
                    return {
                        in: animation,
                        out: animation
                    };
                }
            }
        }
        return null;
    }

    animationFactory(animation?: AnimationKeyframeEffectConfig | AnimationConfig | ReducedAnimationConfigSet | AnimationConfigFactory): AnimationConfigSet {
        if (typeof animation === "function") {
            let currentPath = this.context!.navigation!.history.next;
            if (!this.context!.backNavigating) {
                currentPath = this.context!.navigation!.history.previous;
            }
            let nextPath = this.context!.navigation!.history.current;

            const animationConfig = animation(
                currentPath || '',
                nextPath,
                this.context!.gestureNavigating
            );

            if ('in' in animationConfig) {
                return {
                    in: animationConfig.in,
                    out: animationConfig.out || animationConfig.in
                };
            } else {
                return {
                    in: animationConfig,
                    out: animationConfig
                };
            }
        }

        return this.context!.animation;
    }

    onExited() {}
    
    onExit() {
        if (this.context!.backNavigating)
            this.setState({shouldKeepAlive: false});
        else {
            this.setState({shouldKeepAlive: true});
        }

        if (this.context!.ghostLayer) {
            this.context!.ghostLayer.currentScene = this.sharedElementScene;
        }
    }

    onEnter() {
        if (this.context!.ghostLayer) {
            this.context!.ghostLayer.nextScene = this.sharedElementScene;
        }
    }

    onEntered() {}

    private setRef(ref: HTMLElement | null) {
        if (this.ref !== ref) {
            this.ref = ref;
        }
    }

    get resolvedPathname() {
        return this.props.resolvedPathname;
    }

    render() {
        let Component = this.props.component as React.JSXElementConstructor<any>;
        let HeaderComponent = this.props.config?.header?.component as React.JSXElementConstructor<any>;
        let preloaded = false;
        let headerReloaded = false;
        if ('preloaded' in Component && Component.preloaded) {
            Component = Component.preloaded as React.JSXElementConstructor<any>;
            preloaded = true;
        }
        if (HeaderComponent) {
            if ('preloaded' in HeaderComponent && HeaderComponent.preloaded) {
                HeaderComponent = HeaderComponent.preloaded as React.JSXElementConstructor<any>;
                headerReloaded = true;
            }
        }
        let pseudoElement = undefined;
        if (this.props.config?.pseudoElement) {
            pseudoElement = {
                selector: this.props.config?.pseudoElement.selector,
                animation: this.pseudoElementAnimation
            };
        }
        const params = {
            ...this.props.defaultParams,
            ...this.context!.routesData.get(this.props.path)?.params
        };
        return (
            <AnimationProvider
                onRef={ref => this.animationProviderRef = ref}
                renderAs={this.elementType}
                onExit={this.onExit.bind(this)}
                onExited={this.onExited.bind(this)}
                onEnter={this.onEnter.bind(this)}
                onEntered={this.onEntered.bind(this)}
                in={this.props.in || false}
                out={this.props.out || false}
                name={this.props.name?.toLowerCase().replace(' ', '-') ?? this.name}
                resolvedPathname={this.props.resolvedPathname}
                animation={this.animation}
                pseudoElement={pseudoElement}
                backNavigating={this.context!.backNavigating}
                keepAlive={this.state.shouldKeepAlive ? this.props.config?.keepAlive || false : false}
                navigation={this.context!.navigation}
            >
                <div
                    id={this.name}
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
                        <RouteDataContext.Provider value={{
                            preloaded,
                            path: this.props.path,
                            params
                        }}>
                            <Suspense fallback={<ComponentWithRouteData component={this.props.config?.header?.fallback} />}>
                                <ComponentWithRouteData component={HeaderComponent} />
                            </Suspense>
                            <Suspense fallback={<ComponentWithRouteData component={this.props.fallback} />}>
                                <ComponentWithRouteData component={Component} />
                            </Suspense>
                        </RouteDataContext.Provider>
                    </SharedElementSceneContext.Provider>
                </div>
            </AnimationProvider>
        );
    }
}

interface ComponentWithRouteDataProps {
    component: React.JSXElementConstructor<any>  | LazyExoticComponent<any> | React.ReactNode;
}
function ComponentWithRouteData({component}: ComponentWithRouteDataProps) {
    const navigation = useNavigation();
    const route = useRoute<PlainObject>();
    const Component = component ?? null;
    if (isValidElement(Component)) {
        return cloneElement<any>(Component, {
            orientation: screen.orientation,
            navigation,
            route
        });
    } else if (isValidComponentConstructor(Component)) {
        return (
            <Component
                orientation={screen.orientation}
                navigation={navigation}
                route={route}
            />
        );
    }
    return <>{Component}</>;
}