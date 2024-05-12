import { EasingFunction } from './common/types';
import { Component, RefObject, createRef } from 'react';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';
import { ParallelEffect } from 'web-animations-extension';
import { SharedElement } from './SharedElement';

interface SharedElementTransitionLayerProps {
    navigation: NavigationBase;
}

interface SharedElementTransitionLayerState { }

export class SharedElementTransitionLayer extends Component<SharedElementTransitionLayerProps, SharedElementTransitionLayerState> {
    public readonly ref = createRef<HTMLDialogElement>();
    private _timeline: AnimationTimeline = document.timeline;
    private _playbackRate: number = 1;
    private _outgoingScreen: RefObject<ScreenBase> | null = null;
    private _incomingScreen: RefObject<ScreenBase> | null = null;

    state: SharedElementTransitionLayerState = {
        transitioning: false
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

    get started() {
        return new Promise<void>((resolve) => {
            this.props.navigation.addEventListener('transition-start', () => {
                resolve()
            }, { once: true });
        });
    }

    getAnimationEffect<T extends { instance: SharedElement, clone: Element }>(start: T, end: T) {
        const keyframeEffects = new Array<KeyframeEffect>();
        const startRect = start.instance.getBoundingClientRect();
        const endRect = end.instance.getBoundingClientRect();
        const config = {
            fill: "forwards" as const,
            ...start.instance.props.config,
            ...end.instance.props.config
        };
        if (end.instance.transitionType === "fade") {
            keyframeEffects.push(
                new KeyframeEffect(
                    start.clone.firstElementChild,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 1 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 0 }
                    ],
                    config
                ),
            );
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone.firstElementChild,
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
                    start.clone.firstElementChild,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 1 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 0 }
                    ],
                    config
                ),

            );
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone.firstElementChild,
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
                    start.clone.firstElementChild,
                    [
                        { transform: `translate(${startRect.x}px, ${startRect.y}px)`, opacity: 1 },
                        { transform: `translate(${endRect.x}px, ${endRect.y}px)`, opacity: 0 }
                    ],
                    config
                ),

            );
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone.firstElementChild,
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
                    end.clone.firstElementChild,
                    [
                        { 
                            transform: `translate(${startRect.x}px, ${startRect.y}px)`,
                            width: `${startRect.width}px`,
                            height: `${startRect.height}px`,
                        },
                        {
                            transform: `translate(${endRect.x}px, ${endRect.y}px)`,
                            width: `${endRect.width}px`,
                            height: `${endRect.height}px`,
                        }
                    ],
                    config
                )
            );
        }
        return new ParallelEffect(keyframeEffects);
    }

    get animationEffect() {
        const currentScene = this.outgoingScreen?.current?.sharedElementScene;
        const nextScene = this.incomingScreen?.current?.sharedElementScene;
        if (!currentScene || !nextScene) return null;
        currentScene.previousScene = null;
        nextScene.previousScene = currentScene;
        const parallelEffects = new Array<ParallelEffect>();
        for (const [id, end] of Array.from(nextScene.nodes.entries())) {
            if (end.canTransition) {
                const endClone = end.clone();
                let start = null;
                let startClone = null;
                start = currentScene.nodes.get(id)!;
                startClone = start.clone();
                if (!startClone) continue;
                if (end.transitionType !== "morph") {
                    startClone.id = `${id}-start`;
                    const startStyle = start.ref.current?.firstElementChild?.getAttribute("style");
                    if (startStyle) startClone.setAttribute("style", startStyle);
                    (startClone.firstElementChild as HTMLElement).style.position = "absolute";
                    this.ref.current?.prepend(startClone);
                    start.hide();
                }

                if (!endClone) continue;
                endClone.id = `${id}${end.transitionType === "morph" ? '' : '-end'}`;
                const endStyle = end.ref.current?.firstElementChild?.getAttribute("style");
                if (endStyle) endClone.setAttribute("style", endStyle);
                (endClone.firstElementChild as HTMLElement).style.position = "absolute";
                this.ref.current?.prepend(endClone);
                end.hide();
                const onFinish = () => {
                    end.unhide();
                    start?.unhide();
                    endClone.remove();
                    startClone.remove();
                };
                this.props.navigation.addEventListener('transition-end', onFinish, { once: true });
                this.props.navigation.addEventListener('transition-cancel', onFinish, { once: true });

                parallelEffects.push(this.getAnimationEffect(
                    { instance: start, clone: startClone },
                    { instance: end, clone: endClone }
                ));
            }
        }

        return new ParallelEffect(parallelEffects);
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