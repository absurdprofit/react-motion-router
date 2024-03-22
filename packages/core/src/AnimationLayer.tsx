import { Children, Component, createContext } from 'react';
import { SwipeEndEvent, SwipeEvent, SwipeStartEvent } from 'web-gesture-events';
import { clamp, interpolate } from './common/utils';
import Navigation from './NavigationBase';
import { ScreenBase, ScreenChild } from './index';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import { MotionProgressDetail } from './MotionEvents';
import { SwipeDirection } from './common/types';
import { MAX_PROGRESS, MIN_PROGRESS } from './common/constants';
import GhostLayer from './GhostLayer';

export const Motion = createContext(0);

interface AnimationLayerProps {
    children: ScreenChild | ScreenChild[];
    currentScreen: ScreenBase | null;
    nextScreen: ScreenBase | null;
    navigation: Navigation;
    onGestureNavigationEnd: Function;
    onGestureNavigationStart: Function;
    onDocumentTitleChange(title: string | null): void;
    swipeDirection: SwipeDirection;
    hysteresis: number;
    minFlingVelocity: number;
    swipeAreaWidth: number;
    disableDiscovery: boolean;
    disableBrowserRouting: boolean;
    dispatchEvent: ((event: Event) => Promise<boolean>) | null;
}

interface AnimationLayerState {
    progress: number;
    children: ScreenChild | ScreenChild[];
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


export default class AnimationLayer extends Component<AnimationLayerProps, AnimationLayerState> {
    protected readonly animationLayerData = new AnimationLayerData();
    private ref: HTMLDivElement | null = null;

    constructor(props: AnimationLayerProps) {
        super(props);
        this.animationLayerData.onAnimationStart = this.onStart.bind(this);
        this.animationLayerData.onAnimationEnd = this.onEnd.bind(this);
        this.animationLayerData.onAnimationCancel = this.onCancel.bind(this);
    }

    state: AnimationLayerState = {
        progress: MAX_PROGRESS,
        children: this.props.children,
        shouldPlay: true,
        gestureNavigating: false,
        shouldAnimate: true,
        startX: 0,
        startY: 0,
        swipeDirection: this.props.swipeDirection,
        swipeAreaWidth: this.props.swipeAreaWidth,
        minFlingVelocity: this.props.minFlingVelocity,
        hysteresis: this.props.hysteresis,
        disableDiscovery: false
    }

    static getDerivedStateFromProps({ currentScreen, ...props }: AnimationLayerProps) {
        const config = currentScreen?.props.config;
        return {
            swipeDirection: config?.swipeDirection ?? props.swipeDirection,
            swipeAreaWidth: config?.swipeAreaWidth ?? props.swipeAreaWidth,
            minFlingVelocity: config?.minFlingVelocity ?? props.minFlingVelocity,
            hysteresis: config?.hysteresis ?? props.hysteresis,
            disableDiscovery: config?.disableDiscovery ?? props.disableDiscovery
        }
    }

    componentDidMount() {
        this.animationLayerData.onProgress = this.onProgress.bind(this);
    }

    componentDidUpdate(prevProps: AnimationLayerProps, prevState: AnimationLayerState) {
        if (prevProps.children !== this.props.children) {
            if (!this.state.gestureNavigating && prevState.shouldAnimate) {
                this.animationLayerData.play();
                this.animate();
            }
        }
    }

    private onCancel() {
        const cancelAnimationEvent = new CustomEvent('page-animation-cancel', {bubbles: true});
        this.props.dispatchEvent?.(cancelAnimationEvent);
    }

    private onStart() {
        const startAnimationEvent = new CustomEvent('page-animation-start', {bubbles: true});
        this.props.dispatchEvent?.(startAnimationEvent);
    }

    private onEnd() {
        const endAnimationEvent = new CustomEvent('page-animation-end', {bubbles: true});
        this.props.dispatchEvent?.(endAnimationEvent);
    }

    private onProgress(_progress: number) {
        let progress = _progress;

        if (progress === this.state.progress) return;

        const progressEvent = new CustomEvent<MotionProgressDetail>('motion-progress', {
            detail: {progress}
        });
        if (this.props.dispatchEvent) this.props.dispatchEvent(progressEvent);
        this.setState({progress});
    }

    private async animate() {
        await Promise.all([
            this.animationLayerData.ghostLayer.setupTransition(),
            this.animationLayerData.setupTransition()
        ]);
        requestAnimationFrame(() => {
            this.animationLayerData.ghostLayer.sharedElementTransition();
            this.animationLayerData.pageTransition();
        });
    }

    onSwipeStart = (ev: SwipeStartEvent) => {
        if (ev.touches.length > 1) return; // disable if more than one finger engaged
        if (this.state.disableDiscovery) return;
        if (this.animationLayerData.isPlaying) return;
        if (this.animationLayerData.duration === 0) return;
        let swipePos: number; // 1D
        switch(this.state.swipeDirection) {
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
            if (!Children.count(this.state.children)) return;
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

            this.props.onGestureNavigationStart();
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
                startX: ev.x,
                startY: ev.y
            }, () => {
                const motionStartEvent = new CustomEvent('motion-progress-start');

                this.animationLayerData.gestureNavigating = true;
                this.animationLayerData.playbackRate = -1;
                this.animationLayerData.pause();
                this.animationLayerData.ghostLayer.pause();
                this.animate();
                
                if (this.props.dispatchEvent) this.props.dispatchEvent(motionStartEvent);
                this.ref?.addEventListener('swipe', this.onSwipe);
                this.ref?.addEventListener('swipeend', this.onSwipeEnd);
            });
        }
    }

    onSwipe = (ev: SwipeEvent) => {
        if (this.state.shouldPlay) return;
        let progress: number;
        switch(this.state.swipeDirection) {
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
                this.animationLayerData.playbackRate = -5;
            } else {
                this.animationLayerData.playbackRate = -1;
            }
            onEnd = () => {
                this.props.onGestureNavigationEnd();
                
                this.setState({gestureNavigating: false});

                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
                requestAnimationFrame(() => this.animationLayerData.reset());
            }
            this.setState({shouldPlay: true, shouldAnimate: false});
        } else {
            this.animationLayerData.playbackRate = 0.5;
            onEnd = () => {
                this.animationLayerData.reset();
                
                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, gestureNavigating: false});
        }

        this.setState({startX: 0, startY: 0});
        this.animationLayerData.play();
        this.animationLayerData.ghostLayer.play();
        this.ref?.removeEventListener('swipe', this.onSwipe);
        this.ref?.removeEventListener('swipeend', this.onSwipeEnd);
        queueMicrotask(async () => {
            await this.animationLayerData.finished;
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
                <GhostLayer
                    animationLayerData={this.animationLayerData}
                    currentScene={this.props.currentScreen?.sharedElementScene}
                    nextScene={this.props.nextScreen?.sharedElementScene}
                />
                <div
                    className="animation-layer"
                    ref={this.setRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        '--motion-progress': this.state.progress
                    }  as React.CSSProperties}
                >
                    <Motion.Provider value={this.state.progress}>
                        {this.state.children}
                    </Motion.Provider>
                </div>
            </AnimationLayerDataContext.Provider>
        );
    }
}