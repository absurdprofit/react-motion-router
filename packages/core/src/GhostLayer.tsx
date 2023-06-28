import React from 'react';
import { SharedElement, SharedElementNode, SharedElementScene } from './SharedElement';
import { clamp } from './common/utils';
import { EasingFunction, PlainObject } from './common/types';
import { MotionProgressEvent } from './MotionEvents';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import NavigationBase from './NavigationBase';

interface GhostLayerProps {
    instance?: (instance: GhostLayer | null) => any;
    backNavigating: boolean;
    gestureNavigating: boolean;
    navigation: NavigationBase;
    animationLayerData: AnimationLayerData;
}

interface GhostLayerState {
    transitioning: boolean;
    playing: boolean;
}

interface TransitionXYState {
    delay: number;
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

type AnimationMap = Map<string, PlainObject<Animation>>;

export default class GhostLayer extends React.Component<GhostLayerProps, GhostLayerState> {
    private ref: HTMLDivElement | null = null;
    private _currentScene: SharedElementScene | null = null;
    private _nextScene: SharedElementScene | null = null;
    static contextType = AnimationLayerDataContext;
    context!: React.ContextType<typeof AnimationLayerDataContext>;
    private onProgressStartListener = this.onProgressStart.bind(this) as EventListener;
    private onProgressListener = this.onProgress.bind(this) as EventListener;
    private onProgressEndListener = this.onProgressEnd.bind(this) as EventListener;
    
    state: GhostLayerState = {
        transitioning: false,
        playing: true
    }


    set currentScene(scene: SharedElementScene) {
        this._currentScene = scene;
    }

    set nextScene(scene: SharedElementScene) {
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

    finish() {
        const animations = this.ref?.getAnimations({subtree: true}) || [];
        for (const animation of animations) {
            animation.finish();
        }
    }

    sharedElementTransition(currentScene: SharedElementScene, nextScene: SharedElementScene) {
        if (this.state.transitioning) {
            this.finish(); // cancel playing animation
            return;
        }
        
        const onEnd = () => {
            this.setState({transitioning: false});
            this._nextScene = null;
            this._currentScene = null;
        };

        const onCancel = () => {
            const animations = this.ref?.getAnimations({subtree: true}) || [];
            for (const animation of animations)
                animation.cancel();
            onEnd();
        }
        
        this.setState({transitioning: true}, async () => {
            if (this.context!.duration === 0) return;
            
            for (const [id, start] of currentScene.nodes) {
                //if id exists in next scene
                if (nextScene.nodes.has(id)) {
                    const end = nextScene.nodes.get(id) as SharedElementNode;
                    const endInstance = end.instance;
                    const startInstance = start.instance;
                    const transitionType = endInstance.transitionType || startInstance.transitionType || 'morph';
                    const startNode = start.instance.node;
                    const endNode = nextScene.nodes.get(id)!.instance.node;
                    if (!startNode || !endNode) continue;
                    const startChild = startNode.firstElementChild as HTMLElement | undefined;
                    const endChild = endNode.firstElementChild as HTMLElement | undefined;
                    if (!startChild || !endChild) continue;
                    const startRect = startInstance.clientRect;
                    const endRect = endInstance.clientRect;

                    let startCSSText: string;
                    let startCSSObject: PlainObject<string> = {};
                    let endCSSText: string;
                    let endCSSObject: PlainObject<string> = {};

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
                                delay: startInstance.props.config?.x?.delay ?? endInstance.props.config?.delay ?? 0,
                                duration: startInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.context!.duration,
                                easingFunction: startInstance.props.config?.x?.easingFunction || startInstance.props.config?.easingFunction ||'ease',
                                position: startRect.x - (this.state.playing ? 0 : currentScene.x),
                                
                            },
                            y: {
                                node: startChild,
                                delay: startInstance.props.config?.y?.delay ?? endInstance.props.config?.delay ?? 0,
                                duration: startInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.context!.duration,
                                easingFunction: startInstance.props.config?.y?.easingFunction || startInstance.props.config?.easingFunction || 'ease',
                                position: startRect.y - (this.state.playing ? 0 : currentScene.y)
                            }
                        },
                        end: {
                            x: {
                                node: endNode,
                                delay: endInstance.props.config?.x?.delay ?? endInstance.props.config?.delay ?? 0,
                                duration: endInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.context!.duration,
                                easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                                position: endRect.x - (this.state.playing ? nextScene.x : 0)
                            },
                            y: {
                                node: endChild,
                                delay: endInstance.props.config?.y?.delay ?? endInstance.props.config?.delay ?? 0,
                                duration: endInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.context!.duration,
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-start`
                        });
                        startYAnimation = transitionState.start.y.node.animate(
                            [
                                {
                                    ...startCSSObject,
                                    transform: `translate(0px, ${transitionState.start.y.position}px) ${startCSSObject.transform === 'none' ? '' : startCSSObject.transform}`
                                },
                                {
                                    ...endCSSObject,
                                    transform: `translate(0px, ${transitionState.end.y.position}px) ${endCSSObject.transform === 'none' ? '' : endCSSObject.transform}`
                                }
                            ],
                            {
                                fill: 'both',
                                easing: transitionState.end.y.easingFunction,
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-start`
                            }
                        );
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-start`
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
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-start`
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-end`
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
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-end`
                            }
                        );
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-start`
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
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-start`
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-end`
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
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-end`
                            }
                        );
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-start`
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
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-start`
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
                            duration: transitionState.end.x.duration,
                            delay: transitionState.end.x.delay,
                            id: `${id}-x-end`
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
                                duration: transitionState.end.y.duration,
                                delay: transitionState.end.y.delay,
                                id: `${id}-y-end`
                            }
                        );
                    }
                    const animations = [startXAnimation, startYAnimation, endXAnimation, endYAnimation];
                    
                    if (!this.state.playing) {
                        animations.forEach((animation: Animation | undefined) => {
                            if (!animation) return;
                            const defaultDuration = this.context!.duration;
                            let duration = animation.effect?.getComputedTiming().duration;
                            if (typeof duration === "string") {
                                duration = parseFloat(duration);
                            }
                            duration = duration || defaultDuration;
                            
                            animation.currentTime = duration;
                            animation.pause();
                        });
                    }

                    const onEnd = async () => {
                        console.assert(id === endInstance.id, "Not sure what happened here.");
                        console.assert(id === startInstance.id, "Not sure what happened here.");
                        startNode.style.willChange = 'auto';
                        endNode.style.willChange = 'auto';
                        await endInstance.hidden(false);
                        if (!currentScene.keepAlive || !this.state.playing) {
                            startInstance.keepAlive(false);
                            await startInstance.hidden(false); // if current scene is kept alive do not show start element
                        } else {
                            startInstance.keepAlive(true);
                        }
                        
                        if (!this.state.playing) return;
                        this.ref?.removeChild(startNode);
                        if (transitionType !== "morph") {
                            this.ref?.removeChild(endNode);
                        }
                    };
                    const onCancel = async () => {
                        startNode.style.willChange = 'auto';
                        endNode.style.willChange = 'auto';
                        await startInstance.hidden(false);
                        await endInstance.hidden(false);
                    };
                    Promise.all(
                        animations.map(anim => anim?.finished)
                    ).then(onEnd).catch(onCancel);
                    // this.props.navigation.addEventListener('page-animation-end', onEnd, {once:true});
                }
            }
            
            if (this.ref) {
                Promise.all(
                    this.ref.getAnimations({subtree: true}).map(anim => anim.finished)
                ).then(onEnd).catch(onCancel);
            }
        });

        this.props.navigation.addEventListener('page-animation-cancel' , onCancel, {once: true});
    }
    
    componentDidMount() {
        if (this.props.instance) {
            this.props.instance(this);
        }

        this.props.navigation.addEventListener('motion-progress-start', this.onProgressStartListener, {capture: true});
        this.props.navigation.addEventListener('motion-progress', this.onProgressListener, {capture: true});
        this.props.navigation.addEventListener('motion-progress-end', this.onProgressEndListener, {capture: true});

    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('motion-progress-start', this.onProgressStartListener, {capture: true});
        this.props.navigation.removeEventListener('motion-progress', this.onProgressListener, {capture: true});
        this.props.navigation.removeEventListener('motion-progress-end', this.onProgressEndListener, {capture: true});
    }

    onProgressStart() {
        this.setState({playing: false});
    }

    onProgress(e: MotionProgressEvent) {
        if (!this.state.playing) {
            const animations = this.ref?.getAnimations({subtree: true}) || [];
            for (const animation of animations) {
                const progress = e.detail.progress;
                const defaultDuration = this.context!.duration;
                let duration = animation.effect?.getComputedTiming().duration;
                if (typeof duration === "string") {
                    duration = parseFloat(duration);
                }
                duration = duration || defaultDuration;
                

                const currentTime = (progress / 100) * Number(duration);
                animation.currentTime = currentTime;
            }
        }
    }

    onProgressEnd() {
        if (!this.state.playing) this.finish();
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
                    contain: 'strict'
                }}>
                </div>
            );
        } else {
            return <></>
        }
    }
}