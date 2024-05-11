import { Component, RefObject, createContext, createRef } from 'react';
import { NavigationBase, ScreenBase, ScreenChild } from './index';
import { MotionProgressEvent, TransitionCancelEvent, TransitionEndEvent, TransitionStartEvent } from './common/events';
import { AnimationDirection } from './common/types';
import { SharedElementLayer } from './SharedElementLayer';
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
    public readonly sharedElementLayer = createRef<SharedElementLayer>();
    private readonly animation: Animation = new Animation();
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

    get ready() {
        return this.animation?.ready.then(() => { return; }) ?? Promise.resolve();
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
            .then(() => { return; });
    }

    set screens(screens: RefObject<ScreenBase>[]) {
        this._screens = screens;
    }

    set timeline(timeline: AnimationTimeline) {
        this.animation.timeline = timeline;
    }

    set playbackRate(playbackRate: number) {
        this.animation.playbackRate = playbackRate;
    }

    set direction(direction: PlaybackDirection) {
        this._direction = direction;
        this.animation.effect?.updateTiming({ direction: direction });
    }

    get playbackRate() {
        return this.animation.playbackRate;
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

        if (this.sharedElementLayer.current) {
            const sharedElementEffect = this.sharedElementLayer.current.animationEffect;
            const duration = effect.getComputedTiming().duration;
            if (sharedElementEffect) {
                sharedElementEffect.updateTiming({
                    duration: duration instanceof CSSNumericValue ? duration.to('ms').value : duration
                });
                effect.append(sharedElementEffect);
            }
        }

        this.animation.effect = effect;

        this.ready.then(() => {
            this.sharedElementLayer.current?.ref.current?.showModal();
            this.animation?.play();
            this.onTransitionStart();
        });

        this.animation?.addEventListener('cancel', this.onTransitionCancel.bind(this), { once: true });

        this.finished.then(() => {
            this.animation?.commitStyles();
            this.onTransitionEnd();
            this.sharedElementLayer.current?.ref.current?.close();
            this.animation.effect = null;
        });

        return this.animation;
    }

    render() {
        return (
            <ScreenTransitionLayerContext.Provider value={this}>
                <SharedElementLayer
                    ref={this.sharedElementLayer}
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