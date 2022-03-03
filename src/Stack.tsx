import React from 'react';
import SharedElement from './SharedElement';
import { RouterDataContext } from './RouterData';
import { AnimationConfig, AnimationConfigFactory } from './common/types';
import {Vec2} from './common/utils';
import AnimationProvider from './AnimationProvider';


interface Animation {
    in: AnimationConfig;
    out?: AnimationConfig;
}


export interface ScreenProps {
    out?: boolean;
    in?: boolean;
    component: React.JSXElementConstructor<any>;
    path: string;
    defaultParams?: {};
    config?: {
        animation?: Animation | AnimationConfig | AnimationConfigFactory;
    }
}

export namespace Stack {
    
    export class Screen extends React.Component<ScreenProps> {
        private sharedElementScene: SharedElement.Scene = new SharedElement.Scene(this.props.component.name);
        private ref: HTMLElement | null = null;
        private contextParams = this.context.routesData[this.props.path]?.params;
        private onRef = this.setRef.bind(this);
        private animation: {
            in: AnimationConfig;
            out: AnimationConfig;
        } | (() => {in: AnimationConfig, out: AnimationConfig}) = {
            in: {
                type: 'none',
                duration: 0
            },
            out: {
                type: 'none',
                duration: 0
            }
        }
        private scrollPos: Vec2 = {
            x: 0,
            y: 0
        }
        static contextType = RouterDataContext;
        context!: React.ContextType<typeof RouterDataContext>;
        static defaultProps = {
            route: {
                params: {}
            }
        }

        animationFactory() {
            if (typeof this.props.config?.animation === "function") {
                let currentPath = this.context.navigation.history.next;
                if (!this.context.backNavigating) {
                    currentPath = this.context.navigation.history.previous;
                }
                let nextPath = this.context.navigation.history.current;

                const animationConfig = this.props.config.animation(
                    currentPath || '',
                    nextPath
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

            return this.context.animation;
        }

        componentDidMount() {
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
                this.animation = this.context.animation;
            }

            this.contextParams = this.context.routesData[this.props.path]?.params;
            this.forceUpdate();
        }

        shouldComponentUpdate(nextProps: ScreenProps) {
            if (this.context.routesData[this.props.path]?.params !== this.contextParams) {
                this.contextParams = this.context.routesData[this.props.path]?.params;
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


        onExit() {
            if (this.ref) {
                this.scrollPos = {
                    x: this.ref.scrollLeft,
                    y: this.ref.scrollTop
                }
                
                this.sharedElementScene.scrollPos = this.scrollPos;
            }
            if (this.context.ghostLayer) {
                this.context.ghostLayer.currentScene = this.sharedElementScene;
            }
        }

        onEnter(shouldScroll: boolean) {
            if (shouldScroll) this.ref?.scrollTo(this.scrollPos.x, this.scrollPos.y);
            
            if (this.context.ghostLayer) {
                this.context.ghostLayer.nextScene = this.sharedElementScene;
            }
        }

        private setRef(ref: HTMLElement | null) {
            if (this.ref !== ref) {
                this.ref = ref;

                if (ref) {
                    const clientRect = ref.getBoundingClientRect();
                    const xRatio = (clientRect.width / window.innerWidth).toFixed(2); // transform scale factor due to zoom animation
                    const yRatio = (clientRect.height / window.innerHeight).toFixed(2);
                    this.sharedElementScene.x = clientRect.x;
                    this.sharedElementScene.y = clientRect.y;
                    this.sharedElementScene.xRatio = parseFloat(xRatio);
                    this.sharedElementScene.yRatio = parseFloat(yRatio);
                }
            }
        }

        render() {
            return (
                <AnimationProvider
                    onExit={this.onExit.bind(this)}
                    onEnter={this.onEnter.bind(this)}
                    in={this.props.in || false}
                    out={this.props.out || false}
                    name={this.props.path}
                    animation={this.animation}
                    backNavigating={this.context!.backNavigating}
                >
                    <div
                        ref={this.onRef}
                        className="screen"
                        style={{
                            height: '100vh',
                            width: '100vw',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'absolute',
                            touchAction: 'inherit',
                            overflowX: 'auto',
                            overflowY: 'auto'
                        }}
                    >
                        <SharedElement.SceneContext.Provider value={this.sharedElementScene}>
                            <this.props.component
                                route={{
                                    params: {
                                        ...this.props.defaultParams,
                                        ...this.contextParams
                                    }
                                }}
                                navigation={this.context.navigation}
                            />
                        </SharedElement.SceneContext.Provider>
                    </div>
                </AnimationProvider>
            );
        }
    }
}