import { EasingFunction, WillChange } from './common/types';
import { CSSProperties, Component, RefObject, createRef } from 'react';
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
    #outgoingScreen: RefObject<ScreenBase> | null = null;
    #incomingScreen: RefObject<ScreenBase> | null = null;

    state: SharedElementTransitionLayerState = {
        transitioning: false
    }

    set outgoingScreen(outgoingScreen: RefObject<ScreenBase> | null) {
        this.#outgoingScreen = outgoingScreen;
    }

    set incomingScreen(incomingScreen: RefObject<ScreenBase> | null) {
        this.#incomingScreen = incomingScreen;
    }

    get outgoingScreen() {
        return this.#outgoingScreen;
    }

    get incomingScreen() {
        return this.#incomingScreen;
    }

    getComputedStyles(element: HTMLElement, styles: WillChange[]) {
        const computedStyles: Record<string, string> = {};
        const computedStyle = window.getComputedStyle(element);
        for (const style of styles) {
            computedStyles[style] = computedStyle[style as any];
        }
        return computedStyles;
    }

    getAnimationEffect<T extends { instance: SharedElement, clone: Element }>(start: T, end: T) {
        const keyframeEffects = new Array<KeyframeEffect>();
        const startRect = start.instance.getBoundingClientRect();
        const endRect = end.instance.getBoundingClientRect();
        const config = {
            fill: "forwards" as const,
            duration: "auto",
            ...start.instance.props.config,
            ...end.instance.props.config
        };
        const transitionType = end.instance.transitionType === "fade";
        if (transitionType) {
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
            (end.clone.firstElementChild as HTMLElement).style.mixBlendMode = "plus-lighter";
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
            const willChange = Array.from(new Set([...start.instance.willChange, ...end.instance.willChange]));
            keyframeEffects.push(
                new KeyframeEffect(
                    end.clone.firstElementChild,
                    [
                        {
                            ...Object.fromEntries((start.instance.ref.current?.firstElementChild as HTMLElement).attributeStyleMap),
                            ...this.getComputedStyles(start.instance.ref.current?.firstElementChild as HTMLElement, willChange),
                            transform: `translate(${startRect.x}px, ${startRect.y}px)`,
                            width: `${startRect.width}px`,
                            height: `${startRect.height}px`,
                        },
                        {
                            ...Object.fromEntries((end.instance.ref.current?.firstElementChild as HTMLElement).attributeStyleMap),
                            ...this.getComputedStyles(end.instance.ref.current?.firstElementChild as HTMLElement, willChange),
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
            const start = currentScene.nodes.get(id);
            if (start?.canTransition && end.canTransition) {
                const endClone = end.clone();
                const startClone = start.clone();
                if (!startClone) continue;
                if (end.transitionType !== "morph") {
                    startClone.id = `${id}-start`;
                    (startClone.firstElementChild as HTMLElement).style.position = "absolute";
                    this.ref.current?.prepend(startClone);
                }

                if (!endClone) continue;
                endClone.id = `${id}${end.transitionType === "morph" ? '' : '-end'}`;
                (endClone.firstElementChild as HTMLElement).style.position = "absolute";
                this.ref.current?.prepend(endClone);
                start.hide();
                end.hide();
                const onFinish = () => {
                    end.unhide();
                    start.unhide();
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
                isolation: 'isolate'
            }}>
                <style>{".shared-element-layer::backdrop {display: none}"}</style>
            </dialog>
        );
    }
}