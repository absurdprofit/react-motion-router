import { Component, RefObject, createContext, createRef } from 'react';
import { NavigationBase, ScreenBase, ScreenChild } from './index';
import { MotionProgressEvent, TransitionCancelEvent, TransitionEndEvent, TransitionStartEvent } from './common/events';
import { SharedElementTransitionLayer } from './SharedElementTransitionLayer';
import { ParallelEffect, Animation } from 'web-animations-extension';
import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';

export const Motion = createContext(0);

interface ScreenTransitionLayerProps {
    children: ScreenChild | ScreenChild[];
    navigation: NavigationBase;
}

interface ScreenTransitionLayerState {
    gestureNavigating: boolean;
}

export class ScreenTransitionLayer extends Component<ScreenTransitionLayerProps, ScreenTransitionLayerState> {
    private ref: HTMLDivElement | null = null;
    public readonly sharedElementTransitionLayer = createRef<SharedElementTransitionLayer>();
    public readonly animation: Animation = new Animation();
    private _direction: PlaybackDirection = "normal";
    private _screens: RefObject<ScreenBase>[] = new Array();

    state: ScreenTransitionLayerState = {
        gestureNavigating: false,
    }

    private onTransitionCancel() {
        this.props.navigation.dispatchEvent(new TransitionCancelEvent());
    }

    private onTransitionStart() {
        this.props.navigation.dispatchEvent(new TransitionStartEvent());
    }

    private onTransitionEnd() {
        this.props.navigation.dispatchEvent(new TransitionEndEvent());
    }

    private onProgress(_progress: number) {
        let progress = _progress;

        this.props.navigation.dispatchEvent(new MotionProgressEvent(progress));
    }

    get screens() {
        return this._screens;
    }

    set screens(screens: RefObject<ScreenBase>[]) {
        this._screens = screens;
    }

    set direction(direction: PlaybackDirection) {
        this._direction = direction;
        this.animation.effect?.updateTiming({ direction: direction });
    }

    get direction() {
        return this._direction;
    }

    public transition() {
        const effect = new ParallelEffect([]);
        this.screens.forEach(screen => {
            if (!screen.current?.screenTransitionProvider) return;
            const screenEffect = screen.current.screenTransitionProvider.animationEffect;
            if (screenEffect) effect.append(screenEffect);
        })

        if (this.sharedElementTransitionLayer.current) {
            const sharedElementEffect = this.sharedElementTransitionLayer.current.animationEffect;
            const duration = effect.getComputedTiming().duration;
            if (sharedElementEffect) {
                sharedElementEffect.updateTiming({
                    duration: duration instanceof CSSNumericValue ? duration.to('ms').value : duration
                });
                effect.append(sharedElementEffect);
            }
        }

        this.animation.effect = effect;

        this.animation.ready.then(() => {
            this.sharedElementTransitionLayer.current?.ref.current?.showModal();
            this.animation?.play();
            this.onTransitionStart();
        });

        this.animation?.addEventListener('cancel', this.onTransitionCancel.bind(this), { once: true });

        this.animation.finished.then(() => {
            this.animation?.commitStyles();
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
                />
                <div
                    className="screen-animation-layer"
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        '--motion-progress': 0
                    } as React.CSSProperties}
                >
                    <Motion.Provider value={0}>
                        {this.props.children}
                    </Motion.Provider>
                </div>
            </ScreenTransitionLayerContext.Provider>
        );
    }
}