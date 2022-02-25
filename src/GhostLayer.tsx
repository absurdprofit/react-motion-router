import React from 'react';
import SharedElement from './SharedElement';
import {clamp} from './common/utils';
import { AnimationConfig } from './Router';
import {Vec2, getStyleObject} from './common/utils';
import {MotionProgressEvent} from './AnimationLayer';

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
    playing: boolean;
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
    private _animationMap: {[key:string]:{[key:string]:Animation}} = {};
    private onProgressStartListener = this.onProgressStart.bind(this) as EventListener;
    private onProgressListener = this.onProgress.bind(this) as EventListener;
    private onProgressEndListener = this.onProgressEnd.bind(this) as EventListener;
    
    state: GhostLayerState = {
        transitioning: false,
        playing: true
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
        if (this.props.animation.in.type === "none") return;
        if (this.props.backNavigating && this.props.animation.out.type === "none") return;
        if (this.props.animation.in.duration === 0) return;
        if (this.props.backNavigating && this.props.animation.out.duration === 0) return;

        this.setState({transitioning: true}, () => {
            Object.keys(currentScene.nodes).map((id: string) => {
                //if id exists in next scene
                if (Object.keys(nextScene.nodes).includes(id)) {
                    const endInstance = nextScene.nodes[id].instance;
                    const startInstance = currentScene.nodes[id].instance;
                    const transitionType = endInstance.transitionType || startInstance.transitionType || 'morph';
                    startInstance.hidden = true;
                    endInstance.hidden = true;
                    const startNode = currentScene.nodes[id].node;
                    const endNode = nextScene.nodes[id].node;
                    const startChild = startNode.firstElementChild as HTMLElement;
                    const endChild = endNode.firstElementChild as HTMLElement;
                    const startRect = startInstance.clientRect;
                    const endRect = endInstance.clientRect;

                    const [startCSSText, startCSSObject] = startInstance.getCSSData;
                    const [endCSSText, endCSSObject] = endInstance.getCSSData; 
                    
                    startChild.style.cssText = startCSSText;
                    if (transitionType !== "morph") {
                        endChild.style.cssText = endCSSText;
                    }
                    
                    startNode.style.position = 'absolute';
                    startChild.style.position = 'absolute';
                    startNode.style.zIndex = startChild.style.zIndex;
                    startNode.style.top = '0';
                    startNode.style.left = '0';
                    endNode.style.position = 'absolute';
                    endChild.style.position = 'absolute';
                    endNode.style.zIndex = endChild.style.zIndex;
                    endNode.style.top = '0';
                    endNode.style.left = '0';

                    const transitionState: TransitionState = {
                        id: startInstance.id,
                        start: {
                            x: {
                                node: startNode,
                                duration: startInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: startInstance.props.config?.x?.easingFunction || startInstance.props.config?.easingFunction ||'ease',
                                position: startRect.x - (this.state.playing ? 0 : currentScene.x),
                                
                            },
                            y: {
                                node: startChild,
                                duration: startInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: startInstance.props.config?.y?.easingFunction || startInstance.props.config?.easingFunction || 'ease',
                                position: startRect.y - (this.state.playing ? 0 : currentScene.y)
                            }
                        },
                        end: {
                            x: {
                                node: endNode,
                                duration: endInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                                position: endRect.x - (this.state.playing ? nextScene.x : 0)
                            },
                            y: {
                                node: endChild,
                                duration: endInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration,
                                easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                                position: endRect.y - (this.state.playing ? nextScene.y : 0)
                            }
                        }
                    };

                    startNode.style.display = 'unset';
                    endNode.style.display = 'unset';

                    const startZIndex = parseInt(startNode.style.zIndex) || 0;
                    const endZIndex = parseInt(endNode.style.zIndex) || 0;
                    endNode.style.zIndex = `${clamp(endZIndex, 0, startZIndex - 1)}`;

                    this.ref?.appendChild(startNode);


                    if (transitionType !== "morph") {
                        this.ref?.appendChild(endNode);
                    }
                    
                    let startXAnimation;
                    let startYAnimation;
                    let endXAnimation;
                    let endYAnimation;

                    startNode.style.willChange = 'contents, transform, opacity';
                    endNode.style.willChange = 'contents, transform, opacity';

                    if (transitionType === "morph") {
                        startXAnimation = transitionState.start.x.node.animate([
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
                        startYAnimation = transitionState.start.y.node.animate(
                            [
                                {
                                    ...startCSSObject,
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    ...endCSSObject,
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap[startInstance.id] = {startXAnimation, startYAnimation};
                    } else if (transitionType === "fade") {
                        startXAnimation = transitionState.start.x.node.animate([
                            {
                                transform: `translate(${transitionState.start.x.position}px, 0px)`,
                                opacity: 1
                            },
                            {
                                transform: `translate(${transitionState.end.x.position}px, 0px)`,
                                opacity: 0
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.x.easingFunction,
                            duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        });
                        startYAnimation = transitionState.start.y.node.animate(
                            [
                                {
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );

                        endXAnimation = transitionState.end.x.node.animate([
                            {
                                transform: `translate(${transitionState.start.x.position}px, 0px)`
                            },
                            {
                                transform: `translate(${transitionState.end.x.position}px, 0px)`
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.x.easingFunction,
                            duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        });
                        endYAnimation = transitionState.end.y.node.animate(
                            [
                                {
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap[startInstance.id] = {startXAnimation, startYAnimation, endXAnimation, endYAnimation};
                    } else if (transitionType === "fade-through") {
                        startXAnimation = transitionState.start.x.node.animate([
                            {
                                transform: `translate(${transitionState.start.x.position}px, 0px)`,
                                opacity: 1
                            },
                            {
                                opacity: 0,
                                offset: 0.5
                            },
                            {
                                transform: `translate(${transitionState.end.x.position}px, 0px)`,
                                opacity: 0
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.x.easingFunction,
                            duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        });
                        startYAnimation = transitionState.start.y.node.animate(
                            [
                                {
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );

                        endXAnimation = transitionState.end.x.node.animate([
                            {
                                transform: `translate(${transitionState.start.x.position}px, 0px)`,
                                opacity: 0
                            },
                            {
                                opacity: 0,
                                offset: 0.5
                            },
                            {
                                transform: `translate(${transitionState.end.x.position}px, 0px)`,
                                opacity: 1
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.x.easingFunction,
                            duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        });
                        endYAnimation = transitionState.end.y.node.animate(
                            [
                                {
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap[startInstance.id] = {startXAnimation, startYAnimation, endXAnimation, endYAnimation};
                    } else { // cross-fade
                        startXAnimation = transitionState.start.x.node.animate([
                            {
                                transform: `translate(${transitionState.start.x.position}px, 0px)`,
                                opacity: 1
                            },
                            {
                                transform: `translate(${transitionState.end.x.position}px, 0px)`,
                                opacity: 0
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.x.easingFunction,
                            duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        });
                        startYAnimation = transitionState.start.y.node.animate(
                            [
                                {
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );

                        endXAnimation = transitionState.end.x.node.animate([
                            {
                                transform: `translate(${transitionState.start.x.position}px, 0px)`,
                                opacity: 0
                            },
                            {
                                transform: `translate(${transitionState.end.x.position}px, 0px)`,
                                opacity: 1
                            }
                        ],
                        {
                            fill: 'forwards',
                            easing: transitionState.end.x.easingFunction,
                            duration: clamp(transitionState.end.x.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                        });
                        endYAnimation = transitionState.end.y.node.animate(
                            [
                                {
                                    transform: `translate(0px, ${transitionState.start.y.position}px)`
                                },
                                {
                                    transform: `translate(0px, ${transitionState.end.y.position}px)`
                                }
                            ],
                            {
                                fill: 'forwards',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap[startInstance.id] = {startXAnimation, startYAnimation, endXAnimation, endYAnimation};
                    }
                    
                    if (!this.state.playing) {
                        Object.values(this._animationMap[startInstance.id]).map((animation: Animation) => {
                            const defaultDuration = this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration;
                            let duration = animation.effect?.getComputedTiming().duration;
                            if (typeof duration === "string") {
                                duration = parseFloat(duration);
                            }
                            duration = duration || defaultDuration;
                            
                            animation.currentTime = duration;
                            animation.pause();
                        });
                    }

                    window.addEventListener('page-animation-end', ()=>{
                        startNode.style.willChange = 'auto';
                        endNode.style.willChange = 'auto';
                        startInstance.hidden = false;
                        endInstance.hidden = false;
                        this.ref?.removeChild(startNode);
                        if (transitionType !== "morph") {
                            this.ref?.removeChild(endNode);
                        }
                    }, {once:true});
                }
            });
        });

        window.addEventListener('page-animation-end', () => {
            this.setState({transitioning: false});
            this._nextScene = null;
            this._currentScene = null;
        }, {once: true});
    }
    
    componentDidMount() {
        if (this.props.instance) {
            this.props.instance(this);
        }

        window.addEventListener('motion-progress-start', this.onProgressStartListener);
        window.addEventListener('motion-progress', this.onProgressListener);
        window.addEventListener('motion-progress-end', this.onProgressEndListener);

    }

    componentWillUnmount() {
        window.removeEventListener('motion-progress-start', this.onProgressStartListener);
        window.removeEventListener('motion-progress', this.onProgressListener);
        window.removeEventListener('motion-progress-end', this.onProgressEndListener);
    }

    onProgressStart() {
        this.setState({playing: false});
    }

    onProgress(e: MotionProgressEvent) {
        if (!this.state.playing) {
            Object.values(this._animationMap).map((xYAnimations: {[key:string]:Animation}) => {
                Object.values(xYAnimations).map((animation: Animation) => {
                    const progress = e.detail.progress;
                    const defaultDuration = this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration;
                    let duration = animation.effect?.getComputedTiming().duration;
                    if (typeof duration === "string") {
                        duration = parseFloat(duration);
                    }
                    duration = duration || defaultDuration;
                    

                    const currentTime = (progress / 100) * duration;
                    animation.currentTime = currentTime;
                });
            });
        }
    }

    onProgressEnd() {
        this.setState({playing: true, transitioning: false});
    }

    render() {
        if (this.state.transitioning) {
            return (
                <div id="ghost-layer" ref={c => this.ref = c} style={{
                    position: 'absolute',
                    zIndex: 1000,
                    width: '100vw',
                    height: '100vh',
                }}>
                </div>
            );
        } else {
            return <></>
        }
    }
}