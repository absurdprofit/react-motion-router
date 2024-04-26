import { clamp, interpolate } from './common/utils';
import { AnimationDirection, EasingFunction, PlainObject, ScreenChild, SharedElementNode } from './common/types';
import { MotionProgressEvent } from './common/events';
import { Component, RefObject, createRef } from 'react';
import { MAX_PROGRESS, MAX_Z_INDEX, MIN_PROGRESS } from './common/constants';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';
import { ParallelEffect } from './common/group-effect';
import { GroupAnimation } from './common/group-animation';
import { SharedElement } from './SharedElement';

interface SharedElementLayerProps {
    navigation: NavigationBase;
}

interface SharedElementLayerState {}

interface TransitionState {
    delay: number;
    duration: string | CSSNumberish | undefined;
    easing: EasingFunction;
    position: number;
    node: HTMLElement;
}

export class SharedElementLayer extends Component<SharedElementLayerProps, SharedElementLayerState> {
    private readonly ref = createRef<HTMLDialogElement>();
    private animation: Animation | null = null;
    private _timeline: AnimationTimeline = document.timeline;
    private _playbackRate: number = 1;
    private _outgoingScreen: RefObject<ScreenBase> | null = null;
    private _incomingScreen: RefObject<ScreenBase> | null = null;
    
    state: SharedElementLayerState = {
        transitioning: false
    }

    set timeline(timeline: AnimationTimeline) {
        this._timeline = timeline;
        if (this.animation) this.animation.timeline = timeline;
    }

    set playbackRate(playbackRate: number) {
        this._playbackRate = playbackRate;
        if (this.animation) this.animation.playbackRate = playbackRate;
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

    get ready() {
        return this.animation?.ready.then(() => {return;}) ?? Promise.resolve();
    }

    get started() {
        return new Promise<void>((resolve) => {
            this.props.navigation.addEventListener('transition-start', () => {
                resolve()
            }, { once: true });
        });
    }

    get paused() {
        return this.animation?.playState === "paused";
    }

    get running() {
        return this.animation?.playState === "running";
    }

    get finished() {
        return this.started
            .then(() => this.animation?.finished)
            .then(() => {return;});
    }

    getAnimationEffect<T extends { instance: SharedElement, clone: Element }>(start: T, end: T) {
        const keyframeEffects = new Array<KeyframeEffect>();
        const startRect = start.instance.getBoundingClientRect();
        const endRect = end.instance.getBoundingClientRect();
        const config = {
            fill: "forwards" as const,
            duration: 300,
            ...start.instance.props.config,
            ...end.instance.props.config
        };
        if (end.instance.transitionType === "fade") {
            keyframeEffects.push(
                new KeyframeEffect(
                    start.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 1 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 0 }
                    ],
                    config
                ),
                
            );
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)` },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)` }
                    ],
                    config
                ),
                
            );
        } else if (end.instance.transitionType === "fade-through") {
            keyframeEffects.push(
                new KeyframeEffect(
                    start.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 1 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 0 }
                    ],
                    config
                ),
                
            );
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 0 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 1 }
                    ],
                    config
                ),
                
            );
        } else if (end.instance.transitionType === "cross-fade") {
            keyframeEffects.push(
                new KeyframeEffect(
                    start.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 1 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 0 }
                    ],
                    config
                ),
                
            );
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)` },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)` }
                    ],
                    config
                ),
                
            );
        } else { // morph
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`or },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)` }
                    ],
                    config
                )
            );
        }
        return new ParallelEffect(keyframeEffects);
    }

    async transition() {
        const currentScene = this.outgoingScreen?.current?.sharedElementScene;
        const nextScene = this.incomingScreen?.current?.sharedElementScene;
        if (!currentScene || !nextScene) return;
        currentScene.previousScene = null;
        nextScene.previousScene = currentScene;
        const parallelEffects = new Array<ParallelEffect>();
        for (const [id, end] of Array.from(nextScene.nodes.entries())) {
            if (end.canTransition) {
                const endClone = end.clone();
                end.hide();
                let start = null;
                let startClone = null;
                start = currentScene.nodes.get(id)!;
                if (end.transitionType !== "morph") {
                    startClone = start.clone();
                    if (!startClone) continue;
                    startClone.id = `${id}-start`;
                    this.ref.current?.prepend(startClone);
                    start.hide();
                }

                if (!endClone) continue;
                endClone.id = `${id}-end`;
                this.ref.current?.prepend(endClone);
                this.finished.then(() => {
                    end.unhide();
                    start?.unhide();
                    this.ref.current?.removeChild(endClone);
                    if (startClone) this.ref.current?.removeChild(startClone);
                });

                parallelEffects.push(this.getAnimationEffect(
                    { instance: start, clone: startClone! },
                    { instance: end, clone: endClone }
                ));
            }
        }

        this.ref.current?.showModal();
        this.animation = new GroupAnimation(new ParallelEffect(parallelEffects), this.timeline);
        this.animation.play();
        await this.finished;
        this.ref.current?.close();
    }

    render() {
        return (
            <dialog className="shared-element-layer" ref={this.ref} style={{
                position: 'absolute',
                maxWidth: 'unset',
                maxHeight: 'unset',
                width: '100vw',
                height: '100vh',
                contain: 'strict',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
            }}>
                <style>{".shared-element-layer::backdrop {display: none}"}</style>
            </dialog>
        );
    }
}