import React from 'react';
import SharedElement from './SharedElement';
import {clamp, getCssText} from './common/utils';
import { AnimationConfig } from './Router';
import {Vec2, getStyleObject} from './common/utils';

interface GhostLayerProps {
    instance?: (instance: GhostLayer | null) => any;
    backNavigating: boolean;
    animation: {
        in: AnimationConfig;
        out: AnimationConfig;
    };
}
interface GhostLayerState {
    transitioning: boolean;
}

interface TransitionXYState {
    duration: number;
    easingFunction: SharedElement.EasingFunction;
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
    private _currentScene: SharedElement.Scene | null = null;
    private _nextScene: SharedElement.Scene | null = null;
    state: GhostLayerState = {
        transitioning: false,
    }

    set currentScene(scene: SharedElement.Scene) {
        this._currentScene = scene;
    }

    set nextScene(scene: SharedElement.Scene) {
        this._nextScene = scene;

        if (this._currentScene) {
            if (!this._currentScene.isEmpty() && !this._nextScene.isEmpty()) {
                this.sharedElementTransition(this._currentScene, this._nextScene);
                return;
            }
        }
        this._currentScene = null;
        this._nextScene = null;
    }

    sharedElementTransition(currentScene: SharedElement.Scene, nextScene: SharedElement.Scene) {
        this.setState({transitioning: true}, () => {
            //if id exists in next scene
            for (const id in currentScene.nodes) {
                if (Object.keys(nextScene.nodes).includes(id)) {
                    const endInstance = nextScene.nodes[id].instance;
                    const startInstance = currentScene.nodes[id].instance;
                    startInstance.hidden = true;
                    endInstance.hidden = true;

                    const startNode = currentScene.nodes[id].node;
                    const endNode = nextScene.nodes[id].node;

                    const transitionState: TransitionState = {
                        id: startInstance.id,
                        start: {
                            x: {
                                node: startNode,
                                duration: startInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: startInstance.props.config?.x?.easingFunction || startInstance.props.config?.easingFunction ||'ease',
                                position: parseFloat(startNode.getAttribute('x') || '0') - currentScene.x,
                                
                            },
                            y: {
                                node: startNode.firstElementChild as HTMLElement,
                                duration: startInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: startInstance.props.config?.y?.easingFunction || startInstance.props.config?.easingFunction || 'ease',
                                position: parseFloat(startNode.getAttribute('y') || '0') - currentScene.y
                            }
                        },
                        end: {
                            x: {
                                node: endNode,
                                duration: endInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                                position: parseFloat(endNode.getAttribute('x') || '0') - nextScene.x
                            },
                            y: {
                                node: endNode.firstElementChild as HTMLElement,
                                duration: endInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                                position: parseFloat(endNode.getAttribute('y') || '0') - nextScene.y
                            }
                        }
                    };
                    
                    

                    startNode.style.display = 'unset';
                    endNode.style.display = 'unset';
                    this.ref?.appendChild(startNode);

                    const transitionType = endInstance.transitionType || startInstance.transitionType || 'morph';

                    if (transitionType !== "morph") {
                        this.ref?.appendChild(endNode);
                    }
                    
                    const travelDistance: Vec2 = {
                        x: 0,
                        y: 0
                    }
                    if (endInstance.scene) {
                        travelDistance.x = endInstance.scene.scrollPos.x;
                        travelDistance.y = endInstance.scene.scrollPos.y;
                    }

                    /**
                     * KNOWN ISSUES:
                     * 1. if page 2 scroll position is falsely (0, 0) elements might fail to transition properly.
                     *    has a lot to do with how scrolling works in this implementation.
                     */
                    transitionState.end.x.position = Math.abs(transitionState.end.x.position - travelDistance.x);
                    transitionState.end.y.position = Math.abs(transitionState.end.y.position - travelDistance.y);

                    const startXAnimation = transitionState.start.x.node.animate([
                        {
                            transform: `translate(${transitionState.start.x.position}px, 0px)`
                        },
                        {
                            ...getStyleObject(transitionState.end.x.node.style),
                            transform: `translate(${transitionState.end.x.position}px, 0px)`
                        }
                    ],
                    {
                        fill: 'forwards',
                        easing: transitionState.end.x.easingFunction,
                        duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                    });
                    const startYAnimation = transitionState.start.y.node.animate(
                        [
                            {
                                transform: `translate(0px, ${transitionState.start.y.position}px)`
                            },
                            {
                                ...getStyleObject(transitionState.end.y.node.style),
                                transform: `translate(0px, ${transitionState.end.y.position}px)`
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.y.easingFunction,
                            duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        }
                    );

                    const unhide = () => {
                        startInstance.hidden = false;
                        endInstance.hidden = false;
                        // this.ref?.removeChild(startNode);
                    };

                    if (transitionState.end.y.duration > transitionState.end.x.duration) {
                        startYAnimation.oncancel = unhide;
                        startYAnimation.onfinish = unhide;
                    } else {
                        startXAnimation.oncancel = unhide;
                        startXAnimation.onfinish = unhide;
                    }
                }
            }
        });
        
        setTimeout(() => {
            this.setState({transitioning: false});
            this._nextScene = null;
            this._currentScene = null;
        }, this.props.backNavigating ? this.props.animation.out.duration * 1.1 : this.props.animation.in.duration * 1.1);
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