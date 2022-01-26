import React from 'react';
import SharedElement from './SharedElement';
import {clamp, get_css_text} from './common/utils';
import { AnimationConfig } from './Router';
import {Vec2, get_style_object} from './common/utils';

interface GhostLayerProps {
    instance?: (instance: GhostLayer | null) => any;
    animation: AnimationConfig;
}
interface GhostLayerState {
    transitioning: boolean;
}

interface TransitionXYState {
    duration: number;
    easing_function: SharedElement.EasingFunction;
    position: number;
    node: HTMLElement;
}

interface TransitionState {
    id: string;
    start: {
        x: TransitionXYState;
        y: TransitionXYState;
    };
    end: {
        x: TransitionXYState;
        y: TransitionXYState;
    }
}

export default class GhostLayer extends React.Component<GhostLayerProps, GhostLayerState> {
    private ref: HTMLDivElement | null = null;
    private _current_scene: SharedElement.Scene | null = null;
    private _next_scene: SharedElement.Scene | null = null;
    state: GhostLayerState = {
        transitioning: false,
    }

    set current_scene(scene: SharedElement.Scene) {
        this._current_scene = scene;
    }

    set next_scene(scene: SharedElement.Scene) {
        this._next_scene = scene;

        if (this._current_scene) {
            if (!this._current_scene.is_empty() && !this._next_scene.is_empty()) {
                this.shared_element_transition(this._current_scene, this._next_scene);
                return;
            }
        }
        this._current_scene = null;
        this._next_scene = null;
    }

    shared_element_transition(current_scene: SharedElement.Scene, next_scene: SharedElement.Scene) {
        this.setState({transitioning: true}, () => {
            //if id exists in next scene
            for (const id in current_scene.nodes) {
                if (Object.keys(next_scene.nodes).includes(id)) {
                    const end_instance = next_scene.nodes[id].instance;
                    const start_instance = current_scene.nodes[id].instance;
                    start_instance.hidden = true;
                    end_instance.hidden = true;

                    const start_node = current_scene.nodes[id].node;
                    const end_node = next_scene.nodes[id].node;

                    const transition_state: TransitionState = {
                        id: start_instance.id,
                        start: {
                            x: {
                                node: start_node,
                                duration: start_instance.props.config?.x?.duration || end_instance.props.config?.duration || this.props.animation.duration,
                                easing_function: start_instance.props.config?.x?.easing_function || start_instance.props.config?.easing_function ||'ease',
                                position: parseFloat(start_node.getAttribute('x') || '0'),
                                
                            },
                            y: {
                                node: start_node.firstElementChild as HTMLElement,
                                duration: start_instance.props.config?.y?.duration || end_instance.props.config?.duration || this.props.animation.duration,
                                easing_function: start_instance.props.config?.y?.easing_function || start_instance.props.config?.easing_function || 'ease',
                                position: parseFloat(start_node.getAttribute('y') || '0')
                            }
                        },
                        end: {
                            x: {
                                node: end_node,
                                duration: end_instance.props.config?.x?.duration || end_instance.props.config?.duration || this.props.animation.duration,
                                easing_function: end_instance.props.config?.x?.easing_function || end_instance.props.config?.easing_function || 'ease',
                                position: parseFloat(end_node.getAttribute('x') || '0')
                            },
                            y: {
                                node: end_node.firstElementChild as HTMLElement,
                                duration: end_instance.props.config?.y?.duration || end_instance.props.config?.duration || this.props.animation.duration,
                                easing_function: end_instance.props.config?.x?.easing_function || end_instance.props.config?.easing_function || 'ease',
                                position: parseFloat(end_node.getAttribute('y') || '0')
                            }
                        }
                    };
                    
                    

                    start_node.style.display = 'unset';
                    end_node.style.display = 'unset';


                    this.ref?.appendChild(start_node);

                    
                    const travel_distance: Vec2 = {
                        x: 0,
                        y: 0
                    }
                    if (end_instance.scene) {
                        travel_distance.x = end_instance.scene.scroll_pos.x;
                        travel_distance.y = end_instance.scene.scroll_pos.y;
                    }

                    /**
                     * KNOWN ISSUES:
                     * 1. if page 2 scroll position is falsely (0, 0) elements might fail to transition properly.
                     *    has a lot to do with how scrolling works in this implementation.
                     */
                    transition_state.end.x.position = Math.abs(transition_state.end.x.position - travel_distance.x);
                    transition_state.end.y.position = Math.abs(transition_state.end.y.position - travel_distance.y);


                    const x_animation = transition_state.start.x.node.animate([
                        {
                            transform: `translate(${transition_state.start.x.position}px, 0px)`
                        },
                        {
                            ...get_style_object(transition_state.end.x.node.style),
                            transform: `translate(${transition_state.end.x.position}px, 0px)`
                        }
                    ],
                    {
                        fill: 'forwards',
                        easing: transition_state.end.x.easing_function,
                        duration: clamp(transition_state.end.x.duration, 0, this.props.animation.duration)
                    });
                    const y_animation = transition_state.start.y.node.animate(
                        [
                            {
                                transform: `translate(0px, ${transition_state.start.y.position}px)`
                            },
                            {
                                ...get_style_object(transition_state.end.y.node.style),
                                transform: `translate(0px, ${transition_state.end.y.position}px)`
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transition_state.end.y.easing_function,
                            duration: clamp(transition_state.end.y.duration, 0, this.props.animation.duration)
                        }
                    );

                    const unhide = () => {
                        start_instance.hidden = false;
                        end_instance.hidden = false;
                        this.ref?.removeChild(start_node);
                    };

                    if (transition_state.end.y.duration > transition_state.end.x.duration) {
                        y_animation.oncancel = unhide;
                        y_animation.onfinish = unhide;
                    } else {
                        x_animation.oncancel = unhide;
                        x_animation.onfinish = unhide;
                    }
                }
            }
        });
        
        setTimeout(() => {
            this.setState({transitioning: false});
            this._next_scene = null;
            this._current_scene = null;
        }, this.props.animation.duration * 1.1);
    }
    
    componentDidMount() {
        if (this.props.instance) {
            this.props.instance(this);
        }
    }

    render() {
        if (this.state.transitioning) {
            return (
                <div id="ghost-layer" ref={c => this.ref = c}>
                </div>
            );
        } else {
            return <></>
        }
    }
}