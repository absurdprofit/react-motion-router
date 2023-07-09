import React, { Suspense } from "react";
import AnimationProvider from "./AnimationProvider";
import {
    AnimationConfig,
    AnimationConfigFactory,
    AnimationConfigSet,
    AnimationKeyframeEffectConfig,
    LazyExoticComponent,
    PlainObject,
    ReducedAnimationConfigSet,
    SwipeDirection
} from "./common/types";
import { RouterDataContext } from "./RouterData";
import { SharedElement, SharedElementScene, SharedElementSceneContext } from "./SharedElement";

const DEFAULT_ANIMATION = {
    in: {
        type: 'none',
        duration: 0
    },
    out: {
        type: 'none',
        duration: 0
    }
} as const;

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
    fallback?: React.ReactNode;
    shouldKeepAlive: boolean;
}

export default abstract class ScreenBase<P extends ScreenBaseProps = ScreenBaseProps, S extends ScreenBaseState = ScreenBaseState> extends React.Component<P, S> {
    private name = this.props.path === undefined ? 'not-found' : this.props.path?.toString().slice(1).replace('/', '-') || 'index';
    private sharedElementScene: SharedElementScene = new SharedElementScene(this.name);
    private ref: HTMLElement | null = null;
    private contextParams = this.context?.routesData.get(this.props.path)?.params;
    private onRef = this.setRef.bind(this);
    private animation: AnimationConfigSet | (() => AnimationConfigSet) = DEFAULT_ANIMATION;
    private pseudoElementAnimation: AnimationConfigSet | (() => AnimationConfigSet) = DEFAULT_ANIMATION;
    static contextType = RouterDataContext;
    context!: React.ContextType<typeof RouterDataContext>;
    static defaultProps = {
        route: {
            params: {}
        }
    };

    state: S = {
        shouldKeepAlive: false,
    } as S;

    componentDidMount() {
        this.sharedElementScene.getScreenRect = () => this.ref?.getBoundingClientRect() || new DOMRect();
        this.sharedElementScene.keepAlive = this.props.config?.keepAlive || false;
        if (this.props.fallback && React.isValidElement(this.props.fallback)) {
            this.setState({
                fallback: React.cloneElement<any>(this.props.fallback, {
                    navigation: this.context!.navigation,
                    route: {
                        params: {
                            ...this.props.defaultParams,
                            ...this.contextParams
                        }
                    }
                })
            });
        } else {
            this.setState({fallback: this.props.fallback});
        }
        this.animation = this.setupAnimation(this.props.config?.animation) ?? this.context!.animation;
        this.pseudoElementAnimation = this.setupAnimation(this.props.config?.pseudoElement?.animation) ?? DEFAULT_ANIMATION;

        this.contextParams = this.context!.routesData.get(this.props.path)?.params;
        this.context!.mountedScreen = this;
        this.forceUpdate();
    }

    shouldComponentUpdate(nextProps: P) {
        if (this.context!.routesData.get(this.props.path)?.params !== this.contextParams) {
            this.contextParams = this.context!.routesData.get(this.props.path)?.params;
            return true;
        }
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
        if (prevProps.fallback !== this.props.fallback) {
            if (this.props.fallback && React.isValidElement(this.props.fallback)) {
                this.setState({
                    fallback: React.cloneElement<any>(this.props.fallback, {
                        navigation: this.context!.navigation,
                        route: {
                            params: {
                                ...this.props.defaultParams,
                                ...this.contextParams
                            }
                        }
                    })
                });
            } else {
                this.setState({fallback: this.props.fallback});
            }
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
    
    onExit = () => {
        if (this.context!.backNavigating)
            this.setState({shouldKeepAlive: false});
        else {
            this.setState({shouldKeepAlive: true});
        }

        if (this.context!.ghostLayer) {
            this.context!.ghostLayer.currentScene = this.sharedElementScene;
        }
    }

    onEnter = () => {
        if (this.context!.ghostLayer) {
            this.context!.ghostLayer.nextScene = this.sharedElementScene;
        }
    }

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
        let preloaded = false;
        if ('preloaded' in this.props.component && this.props.component.preloaded) {
            Component = this.props.component.preloaded as React.JSXElementConstructor<any>;
            preloaded = true;
        }
        let pseudoElement = undefined;
        if (this.props.config?.pseudoElement) {
            pseudoElement = {
                selector: this.props.config?.pseudoElement.selector,
                animation: this.pseudoElementAnimation
            };
        }
        return (
            <AnimationProvider
                onExit={this.onExit}
                onEnter={this.onEnter}
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
                        pointerEvents: 'inherit',
                        overflowX: 'auto',
                        overflowY: 'auto'
                    }}
                >
                    <SharedElementSceneContext.Provider value={this.sharedElementScene}>
                        <Suspense fallback={this.state.fallback}>
                            <Component
                                route={{
                                    params: {
                                        ...this.props.defaultParams,
                                        ...this.contextParams
                                    },
                                    preloaded
                                }}
                                navigation={this.context!.navigation}
                                orientation={screen.orientation}
                            />
                        </Suspense>
                    </SharedElementSceneContext.Provider>
                </div>
            </AnimationProvider>
        );
    }
}