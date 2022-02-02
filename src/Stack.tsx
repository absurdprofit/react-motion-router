import React from 'react';
import {CSSTransition} from 'react-transition-group';
import "./css/Transition.css";
import SharedElement from './SharedElement';
import { AnimationConfig, RouterDataContext } from './Router';
import {Vec2} from './common/utils';
import { AnimationProvider } from './AnimationLayer';

export interface ScreenProps {
    out?: boolean;
    in?: boolean;
    component: any;
    path: string;
    defaultParams?: {};
    config?: {
        animation?: {
            in: AnimationConfig;
            out?: AnimationConfig;
        };
    };
}

interface ScreenState {
    _in: boolean;
    xOverflow: boolean;
    yOverflow: boolean;
}


export namespace Stack {
    
    export class Screen extends React.Component<ScreenProps, ScreenState> {
        private transitionString : string = "";
        private sharedElementScene: SharedElement.Scene = new SharedElement.Scene(this.props.component.name);
        private ref: HTMLElement | null = null;
        private observer: ResizeObserver = new ResizeObserver(this.observe.bind(this));
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

        state: ScreenState  = {
            _in: false,
            xOverflow: false,
            yOverflow: true
        }

        componentDidMount() {
            this.setState({_in: Boolean(this.props.path === this.context.currentPath)});
        }
        
        componentDidUpdate() {
            if (this.props.path !== this.context.currentPath) {
                if (!this.state._in) {
                    this.setState({_in: true});
                }
            } else {
                if (this.state._in) {
                    this.setState({_in: false});
                }
            }
        }

        componentWillUnmount() {
            if (this.ref) {
                this.observer.unobserve(this.ref);
            }
        }

        observe(entries: ResizeObserverEntry[]) {
            if (entries.length) {
                const xOverflow = entries[0].target.scrollWidth > window.innerWidth; 
                const yOverflow = entries[0].target.scrollHeight > window.innerHeight;

                if (xOverflow !== this.state.xOverflow) {
                    this.setState({xOverflow: xOverflow});
                }
                if (yOverflow !== this.state.yOverflow) {
                    this.setState({yOverflow: yOverflow});
                }
            }
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

        onEnter() {
            this.ref?.scrollTo(this.scrollPos.x, this.scrollPos.y);
            
            if (this.context.ghostLayer) {
                this.context.ghostLayer.nextScene = this.sharedElementScene;
            }
        }

        private setRef(ref: HTMLElement | null) {
            if (this.ref !== ref) {
                if (this.ref) {
                    this.observer.unobserve(this.ref);
                }

                this.ref = ref;

                if (ref) {
                    this.observer.observe(ref);
                }
            }
        }

        set mounted(_mounted: boolean) {
            
        }

        render() {
            //convert animation into {animation_type}-{animation_direction}
            //e.g. slide-right
            //if animation is fade set animation type only
            // let animationDirection;
            // let animationType;
            // let duration;
            // if (this.context.backNavigating) {
            //     if (this.props.config?.animation && this.props.config.animation.out) {
            //         animationType = this.props.config?.animation.out.type;
            //         animationDirection = this.props.config?.animation.out.direction;
            //         duration = this.props.config.animation.out.duration;
            //     } else {
            //         animationType = this.context.animation!.out.type;
            //         animationDirection = this.context.animation!.out.direction;
            //         duration = this.context.animation.out.duration || 200;
            //     }
            // } else {
            //     if (this.props.config?.animation && this.props.config.animation.in) {
            //         animationType = this.props.config?.animation.in.type;
            //         animationDirection = this.props.config?.animation.in.direction;
            //         duration = this.props.config.animation.in.duration;
            //     } else {
            //         animationType = this.context.animation!.in.type;
            //         animationDirection = this.context.animation!.in.direction;
            //         duration = this.context.animation.in.duration || 200;
            //     }
            // }
            
            // if (animationType === "slide" || animationType === "zoom") {
            //     if (animationType === "zoom") {
            //         this.transitionString = `${animationType}-${animationDirection || 'in'}`;
            //     } else {
            //         this.transitionString = `${animationType}-${animationDirection || 'right'}`;
            //     }
            // } else {
            //     this.transitionString = `${animationType}`;
            // }
            return (
                <AnimationProvider
                    onExit={this.onExit.bind(this)}
                    onEnter={this.onEnter.bind(this)}
                    in={this.props.in || false}
                    out={this.props.out || false}
                    name={this.props.path}
                    animation={this.context!.animation}
                    backNavigating={this.context!.backNavigating}
                >
                    <div
                        ref={this.setRef.bind(this)}
                        className="screen-content"
                        style={{
                            height: '100vh',
                            minWidth: '100vw',
                            display: 'flex',
                            flexDirection: 'column',
                            overflowX: this.state.xOverflow ? 'scroll' : undefined,
                            overflowY: this.state.yOverflow ? 'scroll' : undefined
                        }}
                    >
                        <SharedElement.SceneContext.Provider value={this.sharedElementScene}>
                            <this.props.component
                                route={this.context.routesData[this.props.path] || {
                                    params: this.props.defaultParams || {}
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