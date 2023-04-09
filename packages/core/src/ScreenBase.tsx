import React, { Suspense } from "react";
import AnimationProvider from "./AnimationProvider";
import {
    AnimationConfig,
    AnimationConfigFactory,
    AnimationConfigSet,
    AnimationKeyframeEffectConfig,
    ReducedAnimationConfigSet,
    SwipeDirection
} from "./common/types";
import { RouterDataContext } from "./RouterData";
import SharedElement from "./SharedElement";

export interface ScreenBaseProps {
    out?: boolean;
    in?: boolean;
    component: React.JSXElementConstructor<any>;
    fallback?: React.ReactNode;
    path?: string;
    resolvedPathname?: string;
    defaultParams?: {[key:string]: any};
    name?: string;
    config?: {
        animation?: ReducedAnimationConfigSet | AnimationConfig | AnimationKeyframeEffectConfig | AnimationConfigFactory;
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
    private sharedElementScene: SharedElement.Scene = new SharedElement.Scene(this.props.component.name || this.props.path?.toString() || 'not-found');
    private name = this.props.name?.toLowerCase().replace(' ', '-') || this.props.component.name || this.props.path?.toString().slice(1).replace('/', '-') || 'not-found';
    private ref: HTMLElement | null = null;
    private contextParams = this.context?.routesData.get(this.props.path)?.params;
    private onRef = this.setRef.bind(this);
    private animation: AnimationConfigSet | (() => AnimationConfigSet) = {
        in: {
            type: 'none',
            duration: 0
        },
        out: {
            type: 'none',
            duration: 0
        }
    };
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
        if (this.props.config?.animation) {
            if (typeof this.props.config.animation === "function") {
                this.animation = this.animationFactory.bind(this);
            } else {
                if ('in' in this.props.config.animation) {
                    this.animation = {
                        in: this.props.config.animation.in,
                        out: this.props.config.animation.out || this.props.config.animation.in
                    };
                } else {
                    this.animation = {
                        in: this.props.config.animation,
                        out: this.props.config.animation
                    };
                }
            }
        } else {
            this.animation = this.context!.animation;
        }

        this.contextParams = this.context!.routesData.get(this.props.path)?.params;
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

    animationFactory(): AnimationConfigSet {
        if (typeof this.props.config?.animation === "function") {
            let currentPath = this.context!.navigation!.history.next;
            if (!this.context!.backNavigating) {
                currentPath = this.context!.navigation!.history.previous;
            }
            let nextPath = this.context!.navigation!.history.current;

            const animationConfig = this.props.config.animation(
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
            if (this.ref) {
                this.setTransforms(this.ref); // replace stale transforms
                window.addEventListener('page-animation-end', () => { // scale transforms were stale after animation
                    if (this.ref) this.setTransforms(this.ref);
                }, {once: true});
            }
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

    private setTransforms(ref: HTMLElement) {
        const clientRect = ref.getBoundingClientRect();
        const xRatio = (clientRect.width / window.innerWidth).toFixed(2); // transform scale factor due to zoom animation
        const yRatio = (clientRect.height / window.innerHeight).toFixed(2);
        this.sharedElementScene.x = clientRect.x;
        this.sharedElementScene.y = clientRect.y;
        this.sharedElementScene.xRatio = parseFloat(xRatio);
        this.sharedElementScene.yRatio = parseFloat(yRatio);
    }

    private setRef(ref: HTMLElement | null) {
        if (this.ref !== ref) {
            this.ref = ref;

            if (ref) {
                this.setTransforms(ref);
            }
        }
    }

    get resolvedPathname() {
        return this.props.resolvedPathname;
    }

    render() {
        const Component = this.props.component as React.JSXElementConstructor<any>;
        return (
            <AnimationProvider
                onExit={this.onExit}
                onEnter={this.onEnter}
                in={this.props.in || false}
                out={this.props.out || false}
                name={this.name}
                resolvedPathname={this.props.resolvedPathname}
                animation={this.animation}
                backNavigating={this.context!.backNavigating}
                keepAlive={this.state.shouldKeepAlive ? this.props.config?.keepAlive || false : false}
            >
                <div
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
                    <SharedElement.SceneContext.Provider value={this.sharedElementScene}>
                        <Suspense fallback={this.state.fallback}>
                            <Component
                                route={{
                                    params: {
                                        ...this.props.defaultParams,
                                        ...this.contextParams
                                    }
                                }}
                                navigation={this.context!.navigation}
                            />
                        </Suspense>
                    </SharedElement.SceneContext.Provider>
                </div>
            </AnimationProvider>
        );
    }
}