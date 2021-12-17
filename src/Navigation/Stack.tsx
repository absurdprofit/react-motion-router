import React from 'react';
import {CSSTransition} from 'react-transition-group';
import { disable_scroll, enable_scroll } from '../common/utils';
import {Navigation} from './common/utils';
import "../css/Transition.css";
import { SharedElement } from '.';
import { AnimationConfig, RouterDataContext, RouterData } from './Router';

interface ScreenProps {
    component: any;
    current_path?: string;
    path: string;
    route: {
        params: {[key:string]: any};
    };
    navigation?: Navigation;
    default_params?: {};
    animation?: AnimationConfig;
    shared_elements?: (props: ScreenProps) => string[];
}


export namespace Stack {
    
    export class Screen extends React.Component<ScreenProps> {
        private transition_string : string = "";
        private shared_element_scene: SharedElement.Scene = new SharedElement.Scene(this.props.path);
        static contextType: React.Context<RouterData | null> = RouterDataContext;
        static defaultProps = {
            route: {
                params: {}
            }
        }

        componentDidMount() {
            //convert animation into {animation_type}-{animation_direction}
            //e.g. slide-right
            //if animation is fade set animation type only
            
            if (this.context.animation!.type === "slide") {
                this.transition_string = `${this.context.animation!.type}-${this.context.animation!.direction || 'right'}`;
            } else {
                this.transition_string = `${this.context.animation!.type}`;
            }
        }

        on_exiting() {
            console.log(this.props.path, "on exiting");
            // GhostLayer.set_current_scene(this.shared_element_scene);
            this.context.ghost_layer.current_scene = this.shared_element_scene;
        }

        on_entering() {
            console.log(this.props.path, "on entering");
            // GhostLayer.set_next_scene(this.shared_element_scene);
            this.context.ghost_layer.next_scene = this.shared_element_scene;
        }

        render() {
            if (this.props.path) {
                const _in:boolean = this.props.path === this.context.current_path;
                return (
                    <CSSTransition
                        onEnter={() => {
                            disable_scroll();
                            // this.on_entering();
                        }}
                        onExit={this.on_exiting.bind(this)}
                        onEntering={this.on_entering.bind(this)}
                        onEntered={() => {
                            enable_scroll();
                            // this.on_exiting();
                        }}
                        timeout={this.context.animation!.duration || 200}
                        in={_in}
                        classNames={`screen ${this.transition_string}`}
                        unmountOnExit
                    >
                        <SharedElement.SceneContext.Provider value={this.shared_element_scene}>
                            <this.props.component
                                route={this.context.routes_data[this.props.path] || {
                                    params: this.props.default_params
                                }}
                                navigation={this.context.navigation}
                            />
                        </SharedElement.SceneContext.Provider>
                        
                    </CSSTransition>
                );
            } else {
                return <></>;
            }
        }
    }
}