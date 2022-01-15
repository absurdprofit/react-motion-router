import React from 'react';
import SharedElement from './SharedElement';
import {get_css_text} from './common/utils';
import { AnimationConfig } from './Router';
import {Vec2} from './common/utils';

interface GhostLayerProps {
    instance?: (instance: GhostLayer | null) => any;
    animation: AnimationConfig;
}
interface GhostLayerState {
    transitioning: boolean;
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

                    start_node.style.display = 'unset';
                    end_node.style.display = 'unset';

                    const x_duration: number = end_instance.props.config?.x?.duration || end_instance.props.config?.duration || this.props.animation.duration;
                    const y_duration: number = end_instance.props.config?.y?.duration || end_instance.props.config?.duration || this.props.animation.duration;
                    

                    (start_node.firstChild as HTMLElement).style.transition = `all ${y_duration}ms ${end_instance.props.config?.easing_function ||'ease'}`;
                    start_node.style.transition = `all ${x_duration}ms ${end_instance.props.config?.easing_function ||'ease'}`;
                    this.ref?.appendChild(start_node);

                    const end_pos: Vec2 = {
                        x: parseFloat(end_node.getAttribute('x') || '0'),
                        y: parseFloat(end_node.getAttribute('y') || '0')
                    }
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
                    end_pos.x = Math.abs(end_pos.x - travel_distance.x);
                    end_pos.y = Math.abs(end_pos.y - travel_distance.y);


                    (end_node.firstChild as HTMLElement).style.transform = `translateY(${end_pos.y}px)`;
                    end_node.style.transform = `translateX(${end_pos.x}px)`;
                    (end_node.firstChild as HTMLElement).style.transition = `all ${y_duration}ms ${end_instance.props.config?.easing_function ||'ease'}`;
                    end_node.style.transition = `all ${x_duration}ms ${end_instance.props.config?.easing_function ||'ease'}`;

                    window.requestAnimationFrame(() => {
                        // start_node.style.transform = end_node.style.transform;
                        start_node.animate([
                            {
                                transform: start_node.style.transform
                            },
                            {
                                transform: end_node.style.transform
                            }
                        ],
                        {
                            duration: this.props.animation.duration
                        });
                        (start_node.firstChild as HTMLElement).style.cssText = get_css_text((end_node.firstChild as HTMLElement).style);
                    });

                    setTimeout(() => {
                        start_instance.hidden = false;
                        end_instance.hidden = false;
                        this.ref?.removeChild(start_node);
                    }, this.props.animation.duration);
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