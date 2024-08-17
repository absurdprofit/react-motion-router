import { StylableElement, StyleKeyList, isStylableElement } from './common/types';
import { Component, RefObject, createRef } from 'react';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';
import { ParallelEffect } from 'web-animations-extension';
import { SharedElement } from './SharedElement';
import { toCamelCase } from './common/utils';

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

    getKeyframeProperties(element: Element, styleList: StyleKeyList) {
        const computedStyles: Record<string, string> = {};
        const computedStyle = window.getComputedStyle(element);
        for (const key of styleList) {
            let transformedKey;
            if (key === "offset")
                transformedKey = "cssOffset";
            else if (key === "float")
                transformedKey = "cssFloat";
            else
                transformedKey = toCamelCase(key);
            computedStyles[transformedKey] = computedStyle.getPropertyValue(key);
        }
        return computedStyles;
    }

    copyStyles(srcElement: Element | null | undefined, cloneElement: StylableElement, styleList: StyleKeyList) {
        if (!isStylableElement(srcElement)) return;
        const computedStyles = window.getComputedStyle(srcElement);
        for (const key of styleList) {
            const value = computedStyles.getPropertyValue(key);
            const priority = computedStyles.getPropertyPriority(key);
            cloneElement.style.setProperty(key, value, priority);
        }
    }

    getAnimationEffect<T extends { instance: SharedElement, clone: HTMLElement }>(start: T, end: T) {
        const keyframeEffects = new Array<KeyframeEffect>();
        const startRect = start.instance.getBoundingClientRect();
        const endRect = end.instance.getBoundingClientRect();
        const config: KeyframeEffectOptions = {
            fill: "both" as const,
            duration: "auto",
            easing: "ease",
        };
        const transitionType = end.instance.transitionType;
        const startTransform = `translate(${startRect.x}px, ${startRect.y}px)`;
        const endTransform = `translate(${endRect.x}px, ${endRect.y}px)`;
        switch (transitionType) {
            case "fade":
                keyframeEffects.push(
                    new KeyframeEffect(
                        start.clone,
                        [
                            { transform: startTransform, opacity: 1 },
                            { transform: endTransform, opacity: 0 }
                        ],
                        config
                    ),
                );
                keyframeEffects.push(
                    new KeyframeEffect(
                        end.clone,
                        [
                            { transform: startTransform },
                            { transform: endTransform }
                        ],
                        config
                    ),

                );
                break;
            case "fade-through":
                keyframeEffects.push(
                    new KeyframeEffect(
                        start.clone,
                        [
                            { transform: startTransform, opacity: 1 },
                            { opacity: 0, offset: 0.5 },
                            { transform: endTransform, opacity: 0 }
                        ],
                        config
                    ),

                );
                keyframeEffects.push(
                    new KeyframeEffect(
                        end.clone,
                        [
                            { transform: startTransform, opacity: 0 },
                            { opacity: 0, offset: 0.5 },
                            { transform: endTransform, opacity: 1 }
                        ],
                        config
                    ),

                );
                break;
            case "cross-fade":
                end.clone.style.mixBlendMode = "plus-lighter";
                keyframeEffects.push(
                    new KeyframeEffect(
                        start.clone,
                        [
                            { transform: startTransform, opacity: 1 },
                            { transform: endTransform, opacity: 0 }
                        ],
                        config
                    ),

                );
                keyframeEffects.push(
                    new KeyframeEffect(
                        end.clone,
                        [
                            { transform: startTransform },
                            { transform: endTransform }
                        ],
                        config
                    ),

                );
                break;
            case "morph": {
                const styleList = Array.from(new Set([...start.instance.styles, ...end.instance.styles]));
                keyframeEffects.push(
                    new KeyframeEffect(
                        end.clone,
                        [
                            {
                                ...Object.fromEntries((start.instance.ref.current?.firstElementChild as HTMLElement).attributeStyleMap),
                                transform: startTransform,
                                width: `${startRect.width}px`,
                                height: `${startRect.height}px`,
                            },
                            {
                                ...Object.fromEntries((end.instance.ref.current?.firstElementChild as HTMLElement).attributeStyleMap),
                                ...this.getKeyframeProperties(end.instance.ref.current?.firstElementChild as HTMLElement, styleList),
                                transform: endTransform,
                                width: `${endRect.width}px`,
                                height: `${endRect.height}px`,
                            }
                        ],
                        config
                    )
                );
                break;
            }
        }
        return new ParallelEffect(keyframeEffects);
    }

    get animationEffect() {
        const currentScene = this.outgoingScreen?.current?.sharedElementScene;
        const nextScene = this.incomingScreen?.current?.sharedElementScene;
        if (!currentScene || !nextScene) return null;
        if (currentScene === nextScene) return null;
        currentScene.previousScene = null;
        nextScene.previousScene = currentScene;
        const parallelEffects = new Array<ParallelEffect>();
        for (const [id, end] of Array.from(nextScene.nodes.entries())) {
            const start = currentScene.nodes.get(id);
            if (!start?.canTransition || !end.canTransition) continue;
            const endClone = end.clone();
            const startClone = start.clone();
            if (!startClone || !endClone) continue;
            const styleList = Array.from(new Set([...start.styles, ...end.styles, 'width' as const, 'height' as const]));
            if (end.transitionType !== "morph") {
                startClone.id = `${id}-start`;
                startClone.style.position = "absolute";
                this.copyStyles(start.ref.current?.firstElementChild, startClone, styleList);
                this.copyStyles(end.ref.current?.firstElementChild, endClone, styleList);
                this.ref.current?.prepend(startClone);
            } else if (isStylableElement(start.ref.current?.firstElementChild)) {
                this.copyStyles(start.ref.current.firstElementChild, endClone, styleList);
            }

            endClone.id = `${id}${end.transitionType === "morph" ? '' : '-end'}`;
            endClone.style.position = "absolute";
            this.ref.current?.prepend(endClone);
            start.hide();
            end.hide();
            const onFinish = () => {
                end.unhide();
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