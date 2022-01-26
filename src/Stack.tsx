import React from 'react';
import {CSSTransition} from 'react-transition-group';
import "./css/Transition.css";
import SharedElement from './SharedElement';
import { AnimationConfig, RouterDataContext } from './Router';
import {Vec2} from './common/utils';

interface ScreenProps {
    component: any;
    path: string;
    default_params?: {};
    config?: {
        animation: AnimationConfig;
    };
}

interface ScreenState {
    _in: boolean;
    x_overflow: boolean;
    y_overflow: boolean;
}


export namespace Stack {
    
    export class Screen extends React.Component<ScreenProps, ScreenState> {
        private transition_string : string = "";
        private shared_element_scene: SharedElement.Scene = new SharedElement.Scene(this.props.component.name);
        private ref: HTMLElement | null = null;
        private observer: ResizeObserver = new ResizeObserver(this.observe.bind(this));
        private scroll_pos: Vec2 = {
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
            x_overflow: false,
            y_overflow: true
        }

        componentDidUpdate() {
            if (this.props.path === this.context.current_path) {
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
                const x_overflow = entries[0].target.scrollWidth > window.innerWidth; 
                const y_overflow = entries[0].target.scrollHeight > window.innerHeight;

                if (x_overflow !== this.state.x_overflow) {
                    this.setState({x_overflow: x_overflow});
                }
                if (y_overflow !== this.state.y_overflow) {
                    this.setState({y_overflow: y_overflow});
                }
            }
        }

        on_exit() {
            
            if (this.ref) {
                this.scroll_pos = {
                    x: this.ref.scrollLeft,
                    y: this.ref.scrollTop
                }
                
                this.shared_element_scene.scroll_pos = this.scroll_pos;
            }
            if (this.context.ghost_layer) {
                this.context.ghost_layer.current_scene = this.shared_element_scene;
            }
        }

        on_entering() {
            this.ref?.scrollTo(this.scroll_pos.x, this.scroll_pos.y);
            
            if (this.context.ghost_layer) {
                this.context.ghost_layer.next_scene = this.shared_element_scene;
            }
        }

        private set_ref(ref: HTMLElement | null) {
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

        render() {
            //convert animation into {animation_type}-{animation_direction}
            //e.g. slide-right
            //if animation is fade set animation type only
            const animation_type = this.context.animation!.type || this.props.config?.animation.type;
            const animation_direction = this.context.animation!.direction || this.props.config?.animation.direction;
            
            if (animation_type === "slide" || animation_type === "zoom") {
                if (animation_type === "zoom") {
                    this.transition_string = `${animation_type}-${animation_direction || 'in'}`;
                } else {
                    this.transition_string = `${animation_type}-${animation_direction || 'right'}`;
                }
            } else {
                this.transition_string = `${animation_type}`;
            }
            return (
                <CSSTransition
                    onExit={this.on_exit.bind(this)}
                    onEntering={this.on_entering.bind(this)}
                    timeout={this.props.config?.animation ? this.props.config.animation.duration : this.context.animation.duration || 200}
                    in={this.state._in}
                    classNames={`screen ${this.transition_string}`}
                    style={{
                        height: '100vh',
                        minWidth: '100vw',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowX: this.state.x_overflow ? 'scroll' : undefined,
                        overflowY: this.state.y_overflow ? 'scroll' : undefined
                    }}
                    unmountOnExit
                >
                    <div ref={this.set_ref.bind(this)} className="screen-content">
                        <SharedElement.SceneContext.Provider value={this.shared_element_scene}>
                            <this.props.component
                                route={this.context.routes_data[this.props.path] || {
                                    params: this.props.default_params
                                }}
                                navigation={this.context.navigation}
                            />
                        </SharedElement.SceneContext.Provider>
                    </div>
                </CSSTransition>
            );
        }
    }
}