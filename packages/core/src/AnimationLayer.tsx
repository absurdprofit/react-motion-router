import { Children, Component, RefObject, createContext, createRef } from 'react';
import { SwipeEndEvent, SwipeEvent, SwipeStartEvent } from 'web-gesture-events';
import { clamp, interpolate } from './common/utils';
import { NavigationBase, ScreenBase, ScreenChild } from './index';
import { GestureEndEvent, MotionProgressEndEvent, MotionProgressEvent, MotionProgressStartEvent, TransitionCancelEvent, TransitionEndEvent, TransitionStartEvent } from './common/events';
import { AnimationLayerData, AnimationLayerDataContext } from './AnimationLayerData';
import { SwipeDirection } from './common/types';
import { DEFAULT_GESTURE_CONFIG, MAX_PROGRESS, MIN_PROGRESS } from './common/constants';
import { SharedElementLayer } from './SharedElementLayer';

export const Motion = createContext(0);

interface AnimationLayerProps {
    children: ScreenChild | ScreenChild[];
    navigation: NavigationBase;
    currentScreen: RefObject<ScreenBase> | null;
    nextScreen: RefObject<ScreenBase> | null;
    backNavigating: boolean;
    disableBrowserRouting: boolean;
}

interface AnimationLayerState {
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

export class AnimationLayer extends Component<AnimationLayerProps, AnimationLayerState> {
    protected readonly animationLayerData = new AnimationLayerData();
    protected sharedElementLayer = createRef<SharedElementLayer>();
    private ref: HTMLDivElement | null = null;

    state: AnimationLayerState = {
        progress: MAX_PROGRESS,
        shouldPlay: true,
        gestureNavigating: false,
        shouldAnimate: true,
        startX: 0,
        startY: 0,
        disableDiscovery: false,
        ...DEFAULT_GESTURE_CONFIG,
    }

    static getDerivedStateFromProps(props: AnimationLayerProps, state: AnimationLayerState) {
        const config = props.currentScreen?.current?.routeData.config;
        return {
            swipeDirection: config?.swipeDirection ?? state.swipeDirection,
            swipeAreaWidth: config?.swipeAreaWidth ?? state.swipeAreaWidth,
            minFlingVelocity: config?.minFlingVelocity ?? state.minFlingVelocity,
            hysteresis: config?.hysteresis ?? state.hysteresis,
            disableDiscovery: config?.disableDiscovery ?? state.disableDiscovery
        }
    }

    componentDidMount() {
        this.animationLayerData.onProgress = this.onProgress.bind(this);
        this.props.currentScreen?.current?.animationProvider?.setZIndex(1);
    }

    componentDidUpdate(prevProps: AnimationLayerProps, prevState: AnimationLayerState) {
        if (prevProps.children !== this.props.children) {
            this.direction = this.props.backNavigating ? 'reverse' : 'normal';
            if (!this.state.gestureNavigating && prevState.shouldAnimate) {
                this.play();
                this.animate();
            }
        }
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

        if (progress === this.state.progress) return;

        this.props.navigation.dispatchEvent(new MotionProgressEvent(progress));
        this.setState({ progress });
    }

    private async animate() {
        // await Promise.all([
        //     this.animationLayerData.sharedElementLayer.setupTransition(),
        //     this.animationLayerData.setupTransition()
        // ]);
        requestAnimationFrame(() => {
            this.sharedElementLayer.current?.transition();
            this.transition();
        });
    }

    private commitAndRemoveAnimations() {
        this.animationLayerData.inAnimation?.commitStyles();
        this.animationLayerData.outAnimation?.commitStyles();
        this.animationLayerData.inAnimation = null;
        this.animationLayerData.outAnimation = null;
        this.animationLayerData.pseudoElementInAnimation = null;
        this.animationLayerData.pseudoElementOutAnimation = null;
    }

    private cancelTransition() {
        this.animationLayerData.inAnimation?.cancel();
        this.animationLayerData.outAnimation?.cancel();
        this.animationLayerData.pseudoElementInAnimation?.cancel();
        this.animationLayerData.pseudoElementOutAnimation?.cancel();
    }

    private finishTransition() {
        this.animationLayerData.inAnimation?.finish();
        this.animationLayerData.outAnimation?.finish();
        this.animationLayerData.pseudoElementInAnimation?.finish();
        this.animationLayerData.pseudoElementOutAnimation?.finish();
    }

    get ready() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await Promise.all([
                    this.animationLayerData.outAnimation?.ready,
                    this.animationLayerData.inAnimation?.ready,
                    this.animationLayerData.pseudoElementInAnimation?.ready,
                    this.animationLayerData.pseudoElementOutAnimation?.ready
                ]);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    get started() {
        return new Promise<void>((resolve) => {
            this.props.navigation.addEventListener('transition-start', () => {
                resolve()
            }, { once: true });
        });
    }

    get paused() {
        return this.animationLayerData.inAnimation?.playState === "paused"
            || this.animationLayerData.outAnimation?.playState === "paused"
            || this.animationLayerData.pseudoElementInAnimation?.playState === "paused"
            || this.animationLayerData.pseudoElementOutAnimation?.playState === "paused";
    }

    get running() {
        return this.animationLayerData.inAnimation?.playState === "running"
            || this.animationLayerData.outAnimation?.playState === "running"
            || this.animationLayerData.pseudoElementInAnimation?.playState === "running"
            || this.animationLayerData.pseudoElementOutAnimation?.playState === "running";
    }

    get finished() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this.started;
                await Promise.all([
                    this.animationLayerData.outAnimation?.finished,
                    this.animationLayerData.inAnimation?.finished,
                    this.animationLayerData.pseudoElementInAnimation?.finished,
                    this.animationLayerData.pseudoElementOutAnimation?.finished
                ]);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    private set timeline(timeline: AnimationTimeline) {
        this.animationLayerData.timeline = timeline;
        if (this.animationLayerData.inAnimation)
            this.animationLayerData.inAnimation.timeline = timeline;
        if (this.animationLayerData.outAnimation)
            this.animationLayerData.outAnimation.timeline = timeline;
        if (this.animationLayerData.pseudoElementInAnimation)
            this.animationLayerData.pseudoElementInAnimation.timeline = timeline;
        if (this.animationLayerData.pseudoElementOutAnimation)
            this.animationLayerData.pseudoElementOutAnimation.timeline = timeline;
    }

    private set playbackRate(playbackRate: number) {
        this.animationLayerData.playbackRate = playbackRate;
        if (this.animationLayerData.inAnimation)
            this.animationLayerData.inAnimation.playbackRate = playbackRate;
        if (this.animationLayerData.outAnimation)
            this.animationLayerData.outAnimation.playbackRate = playbackRate;
        if (this.animationLayerData.pseudoElementInAnimation)
            this.animationLayerData.pseudoElementInAnimation.playbackRate = playbackRate;
        if (this.animationLayerData.pseudoElementOutAnimation)
            this.animationLayerData.pseudoElementOutAnimation.playbackRate = playbackRate;
    }

    private set direction(direction: "normal" | "reverse") {
        this.animationLayerData.direction = direction;
        if (this.animationLayerData.inAnimation)
            this.animationLayerData.inAnimation.effect?.updateTiming({ direction: direction });
        if (this.animationLayerData.outAnimation)
            this.animationLayerData.outAnimation.effect?.updateTiming({ direction: direction });
        if (this.animationLayerData.pseudoElementInAnimation)
            this.animationLayerData.pseudoElementInAnimation.effect?.updateTiming({ direction: direction });
        if (this.animationLayerData.pseudoElementOutAnimation)
            this.animationLayerData.pseudoElementOutAnimation.effect?.updateTiming({ direction: direction });
    }

    private pause() {
        this.animationLayerData.inAnimation?.pause();
        this.animationLayerData.outAnimation?.pause();
        this.animationLayerData.pseudoElementInAnimation?.pause();
        this.animationLayerData.pseudoElementOutAnimation?.pause();
    }

    private play() {
        this.animationLayerData.inAnimation?.play();
        this.animationLayerData.outAnimation?.play();
        this.animationLayerData.pseudoElementInAnimation?.play();
        this.animationLayerData.pseudoElementOutAnimation?.play();
    }

    private async transition() {
        if (this.animationLayerData.inAnimation || this.animationLayerData.outAnimation) {
            // cancel playing animation
            this.cancelTransition();
        }
        const currentScreen = this.props.currentScreen?.current;
        const nextScreen = this.props.nextScreen?.current;

        if (currentScreen?.animationProvider && nextScreen?.animationProvider && this.state.shouldAnimate) {
            const timeline = this.timeline;
            this.animationLayerData.outAnimation = new Animation(currentScreen?.animationProvider.animationEffect, timeline);
            this.animationLayerData.inAnimation = new Animation(nextScreen?.animationProvider.animationEffect, timeline);
            await Promise.all([
                nextScreen.animationProvider.setZIndex(1),
                currentScreen.animationProvider.setZIndex(0)
            ]);

            if (this.animationLayerData.inAnimation && this.animationLayerData.outAnimation) {
                if (!this.state.shouldAnimate) {
                    this.finishTransition();
                    this.setState({ shouldAnimate: true });
                    return;
                }

                await this.ready;

                await Promise.all([
                    await nextScreen.onEnter(),
                    await currentScreen.onExit()
                ]);

                if (this.paused) {
                    this.animationLayerData.inAnimation.pause();
                    this.animationLayerData.outAnimation.pause();
                    this.animationLayerData.pseudoElementInAnimation?.pause();
                    this.animationLayerData.pseudoElementOutAnimation?.pause();
                } else {
                    this.animationLayerData.outAnimation.play();
                    this.animationLayerData.inAnimation.play();
                    this.animationLayerData.pseudoElementInAnimation?.play();
                    this.animationLayerData.pseudoElementOutAnimation?.play();
                }
                this.animationLayerData.isStarted = true;
                this.onTransitionStart();

                await this.finished;

                this.commitAndRemoveAnimations();

                await Promise.all([
                    await nextScreen.onEntered(),
                    await currentScreen.onExited()
                ]);

                await nextScreen.animationProvider.setZIndex(1);

                this.onTransitionEnd();

                this.animationLayerData.isStarted = false;
            }
        } else {
            this.state.shouldAnimate = true;
        }
    }

    onSwipeStart = (ev: SwipeStartEvent) => {
        if (ev.touches.length > 1) return; // disable if more than one finger engaged
        if (this.state.disableDiscovery) return;
        if (this.running) return;
        if (this.animationLayerData.duration === 0) return;
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
                this.animationLayerData.gestureNavigating = true;
                this.playbackRate = -1;
                this.pause();
                this.sharedElementLayer.current?.pause();
                this.animate();

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
        this.animationLayerData.progress = progress;
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
        this.play();
        this.sharedElementLayer.current?.play();
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
            <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                <SharedElementLayer
                    ref={this.sharedElementLayer}
                    paused={this.paused}
                    animationLayerData={this.animationLayerData}
                    currentScene={this.props.currentScreen?.current?.sharedElementScene}
                    nextScene={this.props.nextScreen?.current?.sharedElementScene}
                />
                <div
                    className="animation-layer"
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
            </AnimationLayerDataContext.Provider>
        );
    }
}