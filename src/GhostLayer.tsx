import React from 'react';
import SharedElement from './SharedElement';
import {clamp} from './common/utils';
import { AnimationConfig, EasingFunction } from './common/types';
import { MotionProgressEvent } from './MotionEvents';

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
    easingFunction: EasingFunction;
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

type AnimationMap = Map<string, {[key:string]: Animation}>;

export default class GhostLayer extends React.Component<GhostLayerProps, GhostLayerState> {
    private ref: HTMLDivElement | null = null;
    private _currentScene: SharedElement.Scene | null = null;
    private _nextScene: SharedElement.Scene | null = null;
    private _animationMap = new Map<string, {[key:string]: Animation}>();
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
                    // if ('requestIdleCallback' in window)
                    //     requestIdleCallback(this.sharedElementTransition.bind(this, this._currentScene, this._nextScene));
                    // else
                    this.sharedElementTransition(this._currentScene, this._nextScene);
                    return;
                }
            }
            this._currentScene = null;
            this._nextScene = null;
    }

    finish() {
        for (const [_, xYAnimations] of this._animationMap) {
            Object.values(xYAnimations).map((animation: Animation) => animation.finish());
        }
    }

    sharedElementTransition(currentScene: SharedElement.Scene, nextScene: SharedElement.Scene, deadline?: IdleDeadline) {
        if (this.props.animation.in.type === "none") return;
        if (this.props.backNavigating && this.props.animation.out.type === "none") return;
        if (this.props.animation.in.duration === 0) return;
        if (this.props.backNavigating && this.props.animation.out.duration === 0) return;

        if (this.state.transitioning) {
            this.finish(); // cancel playing animation
            return;
        }
        
        this.setState({transitioning: true}, async () => {
            for (const [id, start] of currentScene.nodes) {
                if (deadline && !deadline.timeRemaining()) return;
                //if id exists in next scene
                if (nextScene.nodes.has(id)) {
                    const endInstance = nextScene.nodes.get(id)!.instance;
                    const startInstance = start.instance;
                    const transitionType = endInstance.transitionType || startInstance.transitionType || 'morph';
                    const startNode = start.node;
                    const endNode = nextScene.nodes.get(id)!.node;
                    const startChild = startNode.firstElementChild as HTMLElement;
                    const endChild = endNode.firstElementChild as HTMLElement;
                    const startRect = startInstance.clientRect;
                    const endRect = endInstance.clientRect;

                    let startCSSText: string;
                    let startCSSObject: {[key:string]: string} = {};
                    let endCSSText: string;
                    let endCSSObject: {[key:string]: string} = {};

                    // only get css object when transition type is morph
                    if (transitionType === "morph") {
                        [startCSSText, startCSSObject] = startInstance.CSSData;
                        [endCSSText, endCSSObject] = endInstance.CSSData;
                    }
                    
                    startCSSText = startInstance.CSSText;
                    endCSSText = endInstance.CSSText;
                    
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


                    // account for zoom animation transform scale factor
                    if (this.state.playing) {
                        transitionState.end.x.position = transitionState.end.x.position / nextScene.xRatio;
                        transitionState.end.y.position = transitionState.end.y.position / nextScene.yRatio;
                    } else {
                        transitionState.start.x.position = transitionState.start.x.position / currentScene.xRatio;
                        transitionState.start.y.position = transitionState.start.y.position / currentScene.yRatio;
                    }

                    startNode.style.display = 'unset';
                    endNode.style.display = 'unset';

                    const startZIndex = parseInt(startNode.style.zIndex) || 0;
                    const endZIndex = parseInt(endNode.style.zIndex) || 0;
                    endNode.style.zIndex = `${clamp(endZIndex, 0, startZIndex - 1)}`;

                    this.ref?.appendChild(startNode);

                    if (transitionType !== "morph") {
                        this.ref?.appendChild(endNode);
                    }

                    startInstance.hidden(true);
                    endInstance.hidden(true);
                    
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
                                transform: `translate(${transitionState.end.x.position}px, 0px)`
                            }
                        ],
                        {
                            fill: 'both',
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
                                fill: 'both',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap.set(startInstance.id, {startXAnimation, startYAnimation});
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
                            fill: 'both',
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
                                fill: 'both',
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
                            fill: 'both',
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
                                fill: 'both',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap.set(startInstance.id, {startXAnimation, startYAnimation, endXAnimation, endYAnimation});
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
                            fill: 'both',
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
                                fill: 'both',
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
                            fill: 'both',
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
                                fill: 'both',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap.set(startInstance.id, {startXAnimation, startYAnimation, endXAnimation, endYAnimation});
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
                            fill: 'both',
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
                                fill: 'both',
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
                            fill: 'both',
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
                                fill: 'both',
                                easing: transitionState.end.y.easingFunction,
                                duration: clamp(transitionState.end.y.duration, 0, this.props.backNavigating ? this.props.animation.out.duration : this.props.animation.in.duration)
                            }
                        );
                        this._animationMap.set(startInstance.id, {startXAnimation, startYAnimation, endXAnimation, endYAnimation});
                    }
                    
                    if (!this.state.playing) {
                        Object.values(this._animationMap.get(startInstance.id)!).map((animation: Animation) => {
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

                    window.addEventListener('page-animation-end', async ()=>{
                        startNode.style.willChange = 'auto';
                        endNode.style.willChange = 'auto';
                        await endInstance.hidden(false);
                        await startInstance.hidden(false);
                        this.ref?.removeChild(startNode);
                        if (transitionType !== "morph") {
                            this.ref?.removeChild(endNode);
                        }
                    }, {once:true});
                }
            }
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
            for (const [_, xYAnimations] of this._animationMap) {
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
            }
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
                    contain: 'paint'
                }}>
                </div>
            );
        } else {
            return <></>
        }
    }
}