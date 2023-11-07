import { SharedElement, SharedElementNode, SharedElementScene } from './SharedElement';
import { clamp, interpolate } from './common/utils';
import { EasingFunction, PlainObject } from './common/types';
import { MotionProgressEvent } from './MotionEvents';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import NavigationBase from './NavigationBase';
import { Component } from 'react';
import { MAX_PROGRESS, MAX_Z_INDEX, MIN_PROGRESS } from './common/constants';

interface GhostLayerProps {
    backNavigating: boolean;
    gestureNavigating: boolean;
    navigation: NavigationBase;
    animationLayerData: AnimationLayerData;
}

interface GhostLayerState {
    transitioning: boolean;
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

export default class GhostLayer extends Component<GhostLayerProps, GhostLayerState> {
    private ref: HTMLDialogElement | null = null;
    private _currentScene: SharedElementScene | null = null;
    private _nextScene: SharedElementScene | null = null;
    private animations: Animation[] = [];

    constructor(props: GhostLayerProps) {
        super(props);
        props.animationLayerData.ghostLayer = this;
    }
    
    state: GhostLayerState = {
        transitioning: false
    }

    get finished() {
        return Promise.all(this.animations.map(animation => animation.finished));
    }

    get currentScene() {
        return this._currentScene;
    }

    get nextScene() {
        return this._nextScene;
    }

    set currentScene(scene: SharedElementScene | null) {
        this._currentScene = scene;
    }

    set nextScene(scene: SharedElementScene | null) {
        this._nextScene = scene;
    }

    finish() {
        return this.animations.map(animation => {
            animation.finish();
            return animation.finished;
        });
    }

    setupTransition() {
        return new Promise<void>((resolve) => {
            this.setState({transitioning: true}, resolve);
        });
    }

    setupNode(start: SharedElementNode, end: SharedElementNode) {
        const id = start.id;
        const endInstance = end.instance;
        const startInstance = start.instance;
        const transitionType = endInstance.transitionType || startInstance.transitionType || 'morph';
        const startNode = start.instance.node;
        const endNode = end.instance.node;
        if (!startNode || !endNode) return;
        const startChild = startNode.firstElementChild as HTMLElement | undefined;
        const endChild = endNode.firstElementChild as HTMLElement | undefined;
        if (!startChild || !endChild) return;
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
        } else {
            startCSSText = startInstance.CSSText;
            endCSSText = endInstance.CSSText;
        }
        
        startChild.style.cssText = startCSSText;
        if (transitionType !== "morph") {
            endChild.style.cssText = endCSSText;

            endNode.style.position = 'absolute';
            endChild.style.position = 'absolute';
            endNode.style.zIndex = endChild.style.zIndex;
            endNode.style.top = '0';
            endNode.style.left = '0';
        }
        
        startNode.style.position = 'absolute';
        startChild.style.position = 'absolute';
        startNode.style.zIndex = startChild.style.zIndex;
        startNode.style.top = '0';
        startNode.style.left = '0';
        
        const transitionState: TransitionState = {
            id: startInstance.id,
            start: {
                x: {
                    node: startNode,
                    delay: startInstance.props.config?.x?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: startInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.props.animationLayerData.duration,
                    easingFunction: startInstance.props.config?.x?.easingFunction || startInstance.props.config?.easingFunction ||'ease',
                    position: startRect.x - this.currentScene!.x,
                    // position: startRect.x
                    
                },
                y: {
                    node: startChild,
                    delay: startInstance.props.config?.y?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: startInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.props.animationLayerData.duration,
                    easingFunction: startInstance.props.config?.y?.easingFunction || startInstance.props.config?.easingFunction || 'ease',
                    position: startRect.y - this.currentScene!.y,
                    // position: startRect.y
                }
            },
            end: {
                x: {
                    node: endNode,
                    delay: endInstance.props.config?.x?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: endInstance.props.config?.x?.duration || endInstance.props.config?.duration || this.props.animationLayerData.duration,
                    easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                    position: endRect.x - this.nextScene!.x,
                    // position: endRect.x
                },
                y: {
                    node: endChild,
                    delay: endInstance.props.config?.y?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: endInstance.props.config?.y?.duration || endInstance.props.config?.duration || this.props.animationLayerData.duration,
                    easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                    position: endRect.y - this.nextScene!.y,
                    // position: endRect.y
                }
            }
        };

        startNode.style.transform = `translate(${transitionState.start.x.position}px, 0px)`;
        startChild.style.transform = `translate(0px, ${transitionState.start.y.position}px)`;
        endNode.style.transform = `translate(${transitionState.end.x.position}px, 0px)`;
        endChild.style.transform = `translate(0px, ${transitionState.end.y.position}px)`;

        startNode.style.display = 'unset';

        this.ref?.appendChild(startNode);
        startInstance.onCloneAppended(startNode);

        if (transitionType !== "morph") {
            const startZIndex = parseInt(startNode.style.zIndex) || 0;
            const endZIndex = parseInt(endNode.style.zIndex) || 0;
            endNode.style.zIndex = `${clamp(endZIndex, 0, startZIndex - 1)}`;
            endNode.style.display = 'unset';
            this.ref?.appendChild(endNode);
            endInstance.onCloneAppended(endNode);
        } else {
            endInstance.onCloneAppended(startNode);
        }

        startInstance.hidden(true);
        endInstance.hidden(true);
        
        let startXAnimation;
        let startYAnimation;
        let endXAnimation;
        let endYAnimation;

        startNode.style.willChange = 'contents, transform, opacity';
        if (transitionType !== "morph")
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
        
        animations.forEach((animation: Animation | undefined) => {
            if (!animation) return;
            this.animations.push(animation);
            if (!this.props.animationLayerData.play) {
                const defaultDuration = this.props.animationLayerData.duration;
                let duration = animation.effect?.getComputedTiming().duration;
                duration = Number(duration || defaultDuration);
                
                animation.currentTime = duration;
                animation.pause();
            }
        });

        const onEnd = async () => {
            console.assert(id === endInstance.id, "Not sure what happened here.");
            console.assert(id === startInstance.id, "Not sure what happened here.");
            startNode.style.willChange = 'auto';
            if (transitionType !== "morph")
                endNode.style.willChange = 'auto';
            await endInstance.hidden(false);
            if (!this.currentScene!.keepAlive || !this.props.animationLayerData.play) {
                startInstance.keepAlive(false);
                await startInstance.hidden(false); // if current scene is kept alive do not show start element
            } else {
                startInstance.keepAlive(true);
            }
            
            if (!this.props.animationLayerData.play) return;
            startInstance.onCloneRemove(startNode);
            if (transitionType !== "morph") {
                endInstance.onCloneRemove(endNode);
                endNode.remove();
            } else {
                endInstance.onCloneRemove(startNode);
            }
            startNode.remove();
        };
        const onCancel = async () => {
            startNode.style.willChange = 'auto';
            if (transitionType !== "morph")
                endNode.style.willChange = 'auto';
            await startInstance.hidden(false);
            await endInstance.hidden(false);
        };
        Promise.all(
            animations.map(anim => anim?.finished)
        ).then(onEnd).catch(onCancel);
    }

    sharedElementTransition() {
        if (!this.state.transitioning) return;
        const currentScene = this._currentScene;
        const nextScene = this._nextScene;
        if (!currentScene || !nextScene) return;
        const duration = this.props.animationLayerData.duration;
        currentScene.canTransition = !currentScene.isEmpty() && Boolean(duration);
        nextScene.canTransition = !nextScene.isEmpty() && Boolean(duration);
        if (!currentScene.canTransition || !nextScene.canTransition) return;
        if (this.animations.length) {
            this.finish(); // finish playing animation
        }

        const onEnd = () => {
            this.setState({transitioning: false});
            this._nextScene = null;
            this._currentScene = null;
        };

        const onCancel = () => {
            for (const animation of this.animations)
                animation.cancel();
            onEnd();
        }
        
        this.ref?.showModal(); // render ghost layer in top layer
        const startNodes = [...currentScene.nodes.values()]; 
        startNodes.forEach(startNode => {
            const endNode = nextScene.nodes.get(startNode.id);
            if (!endNode) return;
            this.setupNode(startNode, endNode);
        });
        
        this.finished.then(onEnd).catch(onCancel);

        this.props.navigation.addEventListener('page-animation-cancel' , onCancel, {once: true});
    }
    
    componentDidMount() {
        this.props.navigation.addEventListener('motion-progress-start', this.onProgressStart);
    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('motion-progress-start', this.onProgressStart);
    }

    onProgressStart = () => {
        this.props.navigation.addEventListener('motion-progress', this.onProgress);
        this.props.navigation.addEventListener('motion-progress-end', this.onProgressEnd);
    }

    onProgress = (e: MotionProgressEvent) => {
        if (!this.props.animationLayerData.play) {
            for (const animation of this.animations) {
                const progress = e.detail.progress;
                const defaultDuration = this.props.animationLayerData.duration;
                let duration = animation.effect?.getComputedTiming().duration;
                duration = Number(duration || defaultDuration);

                const currentTime = interpolate(progress, [MIN_PROGRESS, MAX_PROGRESS], [0, Number(duration)]);
                animation.currentTime = currentTime;
            }
        }
    }

    onProgressEnd = async () => {
        if (!this.props.animationLayerData.play) await this.finish();
        this.setState({transitioning: false});
        this.animations = [];
        this.props.navigation.removeEventListener('motion-progress', this.onProgress);
        this.props.navigation.removeEventListener('motion-progress-end', this.onProgressEnd);
    }

    render() {
        if (!this.state.transitioning) return <></>
        return (
            <dialog className="ghost-layer" ref={c => this.ref = c} style={{
                position: 'absolute',
                zIndex: MAX_Z_INDEX,
                maxWidth: 'unset',
                maxHeight: 'unset',
                width: '100vw',
                height: '100vh',
                contain: 'strict',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent'
            }}>
                <style dangerouslySetInnerHTML={{__html: ".ghost-layer::backdrop {display: none}"}}></style>
            </dialog>
        );
    }
}