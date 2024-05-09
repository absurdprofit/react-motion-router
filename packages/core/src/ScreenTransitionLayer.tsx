import { Children, Component, Ref, RefObject, createContext, createRef } from 'react';
import { SwipeEndEvent, SwipeEvent, SwipeStartEvent } from 'web-gesture-events';
import { clamp } from './common/utils';
import { NavigationBase, ScreenBase, ScreenChild } from './index';
import { GestureEndEvent, MotionProgressEndEvent, MotionProgressEvent, MotionProgressStartEvent, TransitionCancelEvent, TransitionEndEvent, TransitionStartEvent } from './common/events';
import { AnimationDirection, SwipeDirection } from './common/types';
import { DEFAULT_GESTURE_CONFIG, MAX_PROGRESS, MIN_PROGRESS } from './common/constants';
import { SharedElementLayer } from './SharedElementLayer';
import { ParallelEffect, Animation } from 'web-animations-extension';
import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';

export const Motion = createContext(0);

interface ScreenTransitionLayerProps {
    children: ScreenChild | ScreenChild[];
    navigation: NavigationBase;
}

interface ScreenTransitionLayerState {
    progress: number;
    shouldPlay: boolean;
    gestureNavigating: boolean;
    shouldAnimate: boolean;
    startX: number;
    startY: number;
    swipeDirection: SwipeDirection;
    swipeAreaWidth: number;
    minFlingVelocity: number;
    hysteresis: number;
    disableDiscovery: boolean;
}

export class ScreenTransitionLayer extends Component<ScreenTransitionLayerProps, ScreenTransitionLayerState> {
    private ref: HTMLDivElement | null = null;
    public readonly sharedElementLayer = createRef<SharedElementLayer>();
    private _animation: Animation | null = null;
    private _timeline: AnimationTimeline = document.timeline;
    private _playbackRate: number = 1;
    private _direction: AnimationDirection = "normal";
    private _screens: RefObject<ScreenBase>[] = new Array();

    state: ScreenTransitionLayerState = {
        progress: MAX_PROGRESS,
        shouldPlay: true,
        gestureNavigating: false,
        shouldAnimate: true,
        startX: 0,
        startY: 0,
        disableDiscovery: false,
        ...DEFAULT_GESTURE_CONFIG,
    }

    // static getDerivedStateFromProps(props: ScreenTransitionLayerProps, state: ScreenTransitionLayerState) {
    //     const config = props.currentScreen?.current?.routeProp.config;
    //     return {
    //         swipeDirection: config?.swipeDirection ?? state.swipeDirection,
    //         swipeAreaWidth: config?.swipeAreaWidth ?? state.swipeAreaWidth,
    //         minFlingVelocity: config?.minFlingVelocity ?? state.minFlingVelocity,
    //         hysteresis: config?.hysteresis ?? state.hysteresis,
    //         disableDiscovery: config?.disableDiscovery ?? state.disableDiscovery
    //     }
    // }

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

        if (progress === this.state.progress) return;

        this.props.navigation.dispatchEvent(new MotionProgressEvent(progress));
        this.setState({ progress });
    }

    get screens() {
        return this._screens;
    }

    get ready() {
        return this.animation?.ready.then(() => { return; }) ?? Promise.resolve();
    }

    get animation() {
        return this._animation;
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
        this._timeline = timeline;
        if (this.animation) this.animation.timeline = timeline;
    }

    set playbackRate(playbackRate: number) {
        this._playbackRate = playbackRate;
        if (this.animation) this.animation.playbackRate = playbackRate;
    }

    set direction(direction: AnimationDirection) {
        this._direction = direction;
        this.animation?.effect?.updateTiming({ direction: direction });
    }

    get timeline() {
        return this._timeline;
    }

    get playbackRate() {
        return this._playbackRate;
    }

    get direction() {
        return this._direction;
    }

    public transition() {
        const timeline = this.timeline;

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

        this._animation = new Animation(effect, timeline);

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
            this._animation = null;
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
                        '--motion-progress': this.state.progress
                    } as React.CSSProperties}
                >
                    <Motion.Provider value={this.state.progress}>
                        {this.props.children}
                    </Motion.Provider>
                </div>
            </ScreenTransitionLayerContext.Provider>
        );
    }
}