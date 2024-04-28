import { Children, Component, Ref, RefObject, createContext, createRef } from 'react';
import { SwipeEndEvent, SwipeEvent, SwipeStartEvent } from 'web-gesture-events';
import { clamp, interpolate } from './common/utils';
import { NavigationBase, ScreenBase, ScreenChild } from './index';
import { GestureEndEvent, MotionProgressEndEvent, MotionProgressEvent, MotionProgressStartEvent, TransitionCancelEvent, TransitionEndEvent, TransitionStartEvent } from './common/events';
import { AnimationDirection, SwipeDirection } from './common/types';
import { DEFAULT_GESTURE_CONFIG, MAX_PROGRESS, MIN_PROGRESS } from './common/constants';
import { SharedElementLayer } from './SharedElementLayer';
import { GroupAnimation } from './common/group-animation';
import { ParallelEffect } from './common/group-effect';
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
    private animation: Animation | null = null;
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
    //     const config = props.currentScreen?.current?.routeData.config;
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

    get playState() {
        return this.animation?.playState;
    }

    public finish() {
        this.animation?.finish();
    }

    public cancel() {
        this.animation?.pause(); // prevent animation from finishing
        this.animation?.cancel();
        this.onTransitionCancel();
    }

    public async transition() {
        if (this.animation) {
            // cancel playing animation
            this.animation.cancel();
        }
        const timeline = this.timeline;

        this.animation = new GroupAnimation(new ParallelEffect(
            this.screens.map(screen => {
                return screen.current?.screenTransitionProvider?.animationEffect ?? new KeyframeEffect(null, [], {})
            })
        ), timeline);

        if (!this.state.shouldAnimate) {
            this.animation.finish();
            this.setState({ shouldAnimate: true });
            return;
        }

        await this.ready;

        this.animation.play();
        this.onTransitionStart();

        await this.finished;

        this.animation.commitStyles();
        this.animation = null;

        this.onTransitionEnd();
    }

    onSwipeStart = (ev: SwipeStartEvent) => {
        if (ev.touches.length > 1) return; // disable if more than one finger engaged
        if (this.state.disableDiscovery) return;
        if (this.running) return;
        let swipePos: number; // 1D
        switch (this.state.swipeDirection) {
            case "left":
            case "right":
                swipePos = ev.x;
                break;

            case "up":
            case "down":
                swipePos = ev.y; // x or y depending on if swipe direction is horizontal or vertical
                break;
        }
        if (ev.direction === this.state.swipeDirection && swipePos < this.state.swipeAreaWidth) {
            // if only one child return
            if (!Children.count(this.props.children)) return;
            ev.stopPropagation();
            // if gesture region in touch path return
            for (let target of ev.composedPath().reverse()) {
                if ('classList' in target && (target as HTMLElement).classList.length) {
                    if (
                        (target as HTMLElement).classList.contains('gesture-region')
                        && (target as HTMLElement).dataset.disabled !== "true"
                    ) return;
                    if (target === ev.gestureTarget) break;
                }
            }

            this.props.navigation.dispatchEvent(new CustomEvent('gesture-start', { detail: { source: ev } }));
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
                startX: ev.x,
                startY: ev.y
            }, () => {
                this.playbackRate = -1;
                this.animation?.pause();
                this.transition();

                this.props.navigation.dispatchEvent(new MotionProgressStartEvent());
                this.ref?.addEventListener('swipe', this.onSwipe);
                this.ref?.addEventListener('swipeend', this.onSwipeEnd);
            });
        }
    }

    onSwipe = (ev: SwipeEvent) => {
        if (this.state.shouldPlay) return;
        let progress: number;
        switch (this.state.swipeDirection) {
            case "left":
            case "right": {
                // left or right
                const x = clamp(ev.x, this.state.startX, this.state.startX + window.innerWidth);
                progress = interpolate(x, [this.state.startX, this.state.startX + window.innerWidth], [MAX_PROGRESS, MIN_PROGRESS]);
                if (this.state.swipeDirection === "left")
                    progress = interpolate(progress, [MAX_PROGRESS, MIN_PROGRESS], [MIN_PROGRESS, MAX_PROGRESS]);
                break;
            }

            case "up":
            case "down": {
                // up or down
                const y = clamp(ev.y, this.state.startY, this.state.startY + window.innerHeight);
                progress = interpolate(y, [this.state.startY, this.state.startY + window.innerHeight], [MAX_PROGRESS, MIN_PROGRESS]);
                if (this.state.swipeDirection === "up")
                    progress = interpolate(progress, [MAX_PROGRESS, MIN_PROGRESS], [MIN_PROGRESS, MAX_PROGRESS]);
                break;
            }

        }
    }

    onSwipeEnd = (ev: SwipeEndEvent) => {
        if (this.state.shouldPlay) return;

        let onEnd: Function | null = null;
        const motionEndEvent = new CustomEvent('motion-progress-end');
        if ((100 - this.state.progress) > this.state.hysteresis || ev.velocity > this.state.minFlingVelocity) {
            if (ev.velocity >= this.state.minFlingVelocity) {
                this.playbackRate = -5;
            } else {
                this.playbackRate = -1;
            }
            onEnd = () => {
                this.props.navigation.dispatchEvent(new GestureEndEvent(ev));

                this.setState({ gestureNavigating: false });

                this.props.navigation.dispatchEvent(new MotionProgressEndEvent());
            }
            this.setState({ shouldPlay: true, shouldAnimate: false });
        } else {
            this.playbackRate = 0.5;
            onEnd = () => {
                this.props.navigation.dispatchEvent(new MotionProgressEndEvent());
            }
            this.setState({ shouldPlay: true, gestureNavigating: false });
        }

        this.setState({ startX: 0, startY: 0 });
        this.animation?.play();
        this.ref?.removeEventListener('swipe', this.onSwipe);
        this.ref?.removeEventListener('swipeend', this.onSwipeEnd);
        queueMicrotask(async () => {
            await this.finished;
            onEnd?.();
        });

    }

    setRef = (ref: HTMLDivElement | null) => {
        if (this.ref) {
            this.ref.removeEventListener('swipestart', this.onSwipeStart);
        }

        this.ref = ref;

        if (ref) {
            ref.addEventListener('swipestart', this.onSwipeStart);
        }
    }

    render() {
        return (
            <ScreenTransitionLayerContext.Provider value={this}>
                <div
                    className="screen-animation-layer"
                    ref={this.setRef}
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