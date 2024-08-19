import { Component, RefObject, createRef } from 'react';
import { MotionProgressEvent, TransitionCancelEvent, TransitionEndEvent, TransitionStartEvent } from './common/events';
import { SharedElementTransitionLayer } from './SharedElementTransitionLayer';
import { ParallelEffect, Animation } from 'web-animations-extension';
import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { ScreenChild } from './common/types';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';
import { MotionContext } from './MotionContext';

interface ScreenTransitionLayerProps {
    children: ScreenChild | ScreenChild[];
    navigation: NavigationBase;
    hasUAVisualTransition: boolean;
}

interface ScreenTransitionLayerState {
    gestureNavigating: boolean;
    progress: number;
}

export class ScreenTransitionLayer extends Component<ScreenTransitionLayerProps, ScreenTransitionLayerState> {
    public readonly sharedElementTransitionLayer = createRef<SharedElementTransitionLayer>();
    public readonly animation: Animation = new Animation();
    #direction: PlaybackDirection = "normal";
    #screens: RefObject<ScreenBase>[] = new Array();

    state: ScreenTransitionLayerState = {
        gestureNavigating: false,
        progress: 1
    }

    private onAnimationFrame() {
        const progress = this.animation.effect?.getComputedTiming().progress;

        if (progress)
            this.onProgress(progress);

        if (this.animation.playState === "running")
            requestAnimationFrame(this.onAnimationFrame.bind(this));
    }

    private onTransitionCancel() {
        this.props.navigation.dispatchEvent(new TransitionCancelEvent());
    }

    private onTransitionStart() {
        this.props.navigation.dispatchEvent(new TransitionStartEvent());

        this.onAnimationFrame();
    }

    private onTransitionEnd() {
        this.props.navigation.dispatchEvent(new TransitionEndEvent());
    }

    private onProgress(progress: number) {
        this.setState({ progress });
        this.props.navigation.dispatchEvent(new MotionProgressEvent(progress));
    }

    get screens() {
        return this.#screens;
    }

    set screens(screens: RefObject<ScreenBase>[]) {
        this.#screens = screens;
    }

    set direction(direction: PlaybackDirection) {
        this.#direction = direction;
        this.animation.effect?.updateTiming({ direction });
    }

    get direction() {
        return this.#direction;
    }

    get hasUAVisualTransition() {
        return this.props.hasUAVisualTransition;
    }

    public transition() {
        const effect = new ParallelEffect(
            this.screens.map(screen => {
                return screen.current?.transitionProvider?.current?.animationEffect ?? null;
            }).filter((effect): effect is AnimationEffect => effect !== null)
        );

        const sharedElementEffect = this.sharedElementTransitionLayer.current?.animationEffect;
        const duration = effect.getComputedTiming().duration;
        if (sharedElementEffect) {
            sharedElementEffect.updateTiming({
                duration: duration instanceof CSSNumericValue ? duration.to('ms').value : duration
            });
            effect.append(sharedElementEffect);
            this.sharedElementTransitionLayer.current?.ref.current?.showModal();
        }

        this.animation.effect = effect;

        this.animation.play();
        this.onTransitionStart();

        this.animation.oncancel = () => {
            this.sharedElementTransitionLayer.current?.ref.current?.close();
            this.onTransitionCancel();
            this.animation.effect = null;
        }
        this.animation.finished.then(() => {
            this.animation.commitStyles();
            this.onTransitionEnd();
            this.sharedElementTransitionLayer.current?.ref.current?.close();
            this.animation.effect = null;
        });

        return this.animation;
    }

    render() {
        return (
            <ScreenTransitionLayerContext.Provider value={this}>
                <SharedElementTransitionLayer
                    ref={this.sharedElementTransitionLayer}
                    navigation={this.props.navigation}
                    direction={this.animation.playbackRate > 0 ? "forwards" : "backwards"}
                />
                <div
                    className="screen-transition-layer"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        contain: 'layout',
                        isolation: 'isolate',
                        '--motion-progress': this.state.progress
                    } as React.CSSProperties}
                >
                    <MotionContext.Provider value={this.state.progress}>
                        {this.props.children}
                    </MotionContext.Provider>
                </div>
            </ScreenTransitionLayerContext.Provider>
        );
    }
}