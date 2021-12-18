import React from 'react';
import {CSSTransition} from 'react-transition-group';
import "../css/Transition.css";
import SharedElement from './SharedElement';
import { RouterDataContext } from './Router';
import {Vec2} from './common/utils';

interface ScreenProps {
    component: any;
    path: string;
    default_params?: {};
}

interface ScreenState {
    _in: boolean;
}


export namespace Stack {
    
    export class Screen extends React.Component<ScreenProps, ScreenState> {
        private transition_string : string = "";
        private shared_element_scene: SharedElement.Scene = new SharedElement.Scene(this.props.path);
        private ref: HTMLElement | null = null;
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
            _in: false
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

        render() {
            //convert animation into {animation_type}-{animation_direction}
            //e.g. slide-right
            //if animation is fade set animation type only
            if (this.context.animation!.type === "slide") {
                this.transition_string = `${this.context.animation!.type}-${this.context.animation!.direction || 'right'}`;
            } else {
                this.transition_string = `${this.context.animation!.type}`;
            }

            return (
                <CSSTransition
                    onExit={this.on_exit.bind(this)}
                    onEntering={this.on_entering.bind(this)}
                    timeout={this.context.animation.duration || 200}
                    in={this.state._in}
                    classNames={`screen ${this.transition_string}`}
                    unmountOnExit
                >
                    <div ref={(ref) => this.ref = ref} className="screen-content">
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