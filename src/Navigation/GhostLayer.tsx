import React from 'react';
import SharedElement from './SharedElement';
import {get_css_text} from '../common/utils';

interface GhostLayerProps {
    transition_duration: number;
    instance?: (instance: GhostLayer | null) => any;
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
            console.log("---Shared element transition here---");
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
                    (start_node.firstChild as HTMLElement).style.transition = `all ${this.props.transition_duration}ms ease`;
                    (start_node as HTMLElement).style.transition = `all ${this.props.transition_duration}ms ease`;
                    this.ref?.appendChild(start_node);
                    // window.scrollTo(0, 0);

                    const end_node = next_scene.nodes[id].node;
                    (end_node.firstChild as HTMLElement).style.transition = `all ${this.props.transition_duration}ms ease`;
                    setTimeout(() => {
                        (start_node.firstChild as HTMLElement).style.cssText = get_css_text((end_node.firstChild as HTMLElement).style);
                    }, this.props.transition_duration/5);
                    setTimeout(() => {
                        start_instance.hidden = false;
                        end_instance.hidden = false;
                        this.ref?.removeChild(start_node);
                    }, this.props.transition_duration * 1.1);
                }
            }
        });
        
        setTimeout(() => {
            this.setState({transitioning: false});
            this._next_scene = null;
            this._current_scene = null;
        }, this.props.transition_duration * 1.5);
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