import { SharedElementNode, SharedElementScene } from './SharedElement';
import { clamp, interpolate } from './common/utils';
import { AnimationDirection, EasingFunction, PlainObject, ScreenChild } from './common/types';
import { MotionProgressEvent } from './common/events';
import { Component, RefObject } from 'react';
import { MAX_PROGRESS, MAX_Z_INDEX, MIN_PROGRESS } from './common/constants';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';

interface SharedElementLayerProps {
    navigation: NavigationBase;
}

interface SharedElementLayerState {
    transitioning: boolean;
}

interface TransitionXYState {
    delay: number;
    duration: string | CSSNumberish | undefined;
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

export class SharedElementLayer extends Component<SharedElementLayerProps, SharedElementLayerState> {
    private ref: HTMLDialogElement | null = null;
    private animations: Animation[] = [];
    private _timeline: AnimationTimeline = document.timeline;
    private _playbackRate: number = 1;
    private _outgoingScreen: RefObject<ScreenBase> | null = null;
    private _incomingScreen: RefObject<ScreenBase> | null = null;
    
    state: SharedElementLayerState = {
        transitioning: false
    }

    set timeline(timeline: AnimationTimeline) {
        this._timeline = timeline;
        // if (this.animation) this.animation.timeline = timeline;
    }

    set playbackRate(playbackRate: number) {
        this._playbackRate = playbackRate;
        // if (this.animation) this.animation.playbackRate = playbackRate;
    }

    set outgoingScreen(outgoingScreen: RefObject<ScreenBase> | null) {
        this._outgoingScreen = outgoingScreen;
    }

    set incomingScreen(incomingScreen: RefObject<ScreenBase> | null) {
        this._incomingScreen = incomingScreen;
    }

    get outgoingScreen() {
        return this._outgoingScreen;
    }

    get incomingScreen() {
        return this._incomingScreen;
    }

    get timeline() {
        return this._timeline;
    }

    get playbackRate() {
        return this._playbackRate;
    }

    get finished() {
        return Promise.all(this.animations.map(animation => animation.finished));
    }

    pause() {
        this.animations.forEach(animation => {
            animation.playbackRate = this.playbackRate;
            return animation.pause();
        });
    }

    play() {
        this.animations.forEach(animation => {
            animation.playbackRate = this.playbackRate;
            return animation.play();
        });
    }

    finish() {
        const playbackRate = this.playbackRate;
        return Promise.all(
            this.animations.map(animation => {
                animation.playbackRate = playbackRate;
                animation.finish();
                return animation.finished;
            })
        );
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
        const startRect = startInstance.rect;
        const endRect = endInstance.rect;
        // const defaultDuration = this.animation?.effect?.getComputedTiming().duration;
        const defaultDuration = 0;

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
                    duration: startInstance.props.config?.x?.duration || endInstance.props.config?.duration || defaultDuration,
                    easingFunction: startInstance.props.config?.x?.easingFunction || startInstance.props.config?.easingFunction ||'ease',
                    position: startRect.x
                    
                },
                y: {
                    node: startChild,
                    delay: startInstance.props.config?.y?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: startInstance.props.config?.y?.duration || endInstance.props.config?.duration || defaultDuration,
                    easingFunction: startInstance.props.config?.y?.easingFunction || startInstance.props.config?.easingFunction || 'ease',
                    position: startRect.y
                }
            },
            end: {
                x: {
                    node: endNode,
                    delay: endInstance.props.config?.x?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: endInstance.props.config?.x?.duration || endInstance.props.config?.duration || defaultDuration,
                    easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                    position: endRect.x
                },
                y: {
                    node: endChild,
                    delay: endInstance.props.config?.y?.delay ?? endInstance.props.config?.delay ?? 0,
                    duration: endInstance.props.config?.y?.duration || endInstance.props.config?.duration || defaultDuration,
                    easingFunction: endInstance.props.config?.x?.easingFunction || endInstance.props.config?.easingFunction || 'ease',
                    position: endRect.y
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
            // if (this.props.paused) {
            //     const defaultDuration = this.props.animation?.effect?.getComputedTiming().duration;
            //     let duration = animation.effect?.getComputedTiming().duration;
            //     duration = Number(duration || defaultDuration);
                
            //     animation.currentTime = duration;
            //     animation.pause();
            // }
        });

        const onEnd = async () => {
            let startInstance = start.instance;
            let endInstance = end.instance;
            if (this.playbackRate < 0)
                [startInstance, endInstance] = [endInstance, startInstance];
            endInstance.hidden(false);
            // if (!this.props.currentScene!.keepAlive) {
            //     startInstance.keepAlive(false);
            // } else {
            //     startInstance.keepAlive(true);
            //     startInstance.hidden(false); // if current scene is kept alive do not show start element
            // }
            
            startInstance.onCloneRemove(startNode);
            if (transitionType !== "morph") {
                endInstance.onCloneRemove(endNode);
            } else {
                endInstance.onCloneRemove(startNode);
            }
        };
        const onCancel = async () => {
            Promise.all([
                startInstance.hidden(false),
                endInstance.hidden(false)
            ]);
        };
        Promise.all(
            animations.map(anim => anim?.finished)
        ).then(onEnd).catch(onCancel);
    }

    transition() {
        if (!this.state.transitioning) return;
        const currentScene = this.outgoingScreen?.current?.sharedElementScene;
        const nextScene = this.incomingScreen?.current?.sharedElementScene;
        if (!currentScene || !nextScene) return;
        // const duration = this.props.animation?.effect?.getComputedTiming().duration;
        const duration = 0;
        currentScene.canTransition = !currentScene.isEmpty() && Boolean(duration);
        nextScene.canTransition = !nextScene.isEmpty() && Boolean(duration);
        if (!currentScene.canTransition || !nextScene.canTransition) return;
        if (this.animations.length) {
            this.finish(); // finish playing animation
        }

        const onEnd = () => {
            this.setState({transitioning: false});
            this.animations = [];
        };

        const onCancel = () => {
            for (const animation of this.animations)
                animation.cancel();
            onEnd();
        }
        
        this.ref?.showModal(); // render shared element layer in top layer
        for (const startNode of currentScene.nodes.values()) {
            const endNode = nextScene.nodes.get(startNode.id);
            if (!endNode) continue;
            this.setupNode(startNode, endNode);
        }
        
        this.finished.then(onEnd).catch(onCancel);

        this.props.navigation.addEventListener('transition-cancel' , onCancel, {once: true});
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
        // if (this.props.paused) {
        //     for (const animation of this.animations) {
        //         const progress = e.progress;
        //         const defaultDuration = this.props.animation?.effect?.getComputedTiming().duration;
        //         const defaultDuration = this.props.animation?.effect?.getComputedTiming().duration;
        //         let duration = animation.effect?.getComputedTiming().duration;
        //         duration = Number(duration || defaultDuration);

        //         const currentTime = interpolate(progress, [MIN_PROGRESS, MAX_PROGRESS], [0, Number(duration)]);
        //         animation.currentTime = currentTime;
        //     }
        // }
    }

    onProgressEnd = async () => {
        await this.finish();
        this.setState({transitioning: false});
        this.animations = [];
        this.props.navigation.removeEventListener('motion-progress', this.onProgress);
        this.props.navigation.removeEventListener('motion-progress-end', this.onProgressEnd);
    }

    render() {
        if (!this.state.transitioning) return <></>
        return (
            <dialog className="shared-element-layer" ref={c => this.ref = c} style={{
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
                <style dangerouslySetInnerHTML={{__html: ".shared-element-layer::backdrop {display: none}"}}></style>
            </dialog>
        );
    }
}