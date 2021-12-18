import React from 'react';
import SharedElement from './SharedElement';
import {get_css_text} from '../common/utils';
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
                    (start_node.firstChild as HTMLElement).style.transition = `all ${this.props.animation.duration}ms ease`;
                    (start_node as HTMLElement).style.transition = `all ${this.props.animation.duration}ms ease`;
                    this.ref?.appendChild(start_node);

                    const end_node = next_scene.nodes[id].node;
                    const end_pos: Vec2 = {
                        x: parseFloat((end_node as HTMLElement).getAttribute('x') || '0'),
                        y: parseFloat((end_node as HTMLElement).getAttribute('y') || '0')
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
                    (end_node.firstChild as HTMLElement).style.transform = `translate(${end_pos.x}px, ${end_pos.y}px)`;
                    (end_node.firstChild as HTMLElement).style.transition = `all ${this.props.animation.duration}ms ease`;
                    
                    setTimeout(() => {
                        (start_node.firstChild as HTMLElement).style.cssText = get_css_text((end_node.firstChild as HTMLElement).style);
                    }, this.props.animation.duration/5);
                    setTimeout(() => {
                        start_instance.hidden = false;
                        end_instance.hidden = false;
                        this.ref?.removeChild(start_node);
                    }, this.props.animation.duration * 1.1);
                }
            }
        });
        
        setTimeout(() => {
            this.setState({transitioning: false});
            this._next_scene = null;
            this._current_scene = null;
        }, this.props.animation.duration * 1.5);
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