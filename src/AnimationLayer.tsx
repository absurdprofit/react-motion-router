import React, { createContext } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import { clamp, Navigation } from './common/utils';
import AnimationKeyframePresets from './Animations';
import { AnimationConfig } from './Router';
import {ScreenChild, ScreenChildren} from './index';

export class AnimationLayerData {
    private _progress: number = 0;
    private _play: boolean = true;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _onExit: Function | undefined;
    private _onEnter: Function | undefined;
    private _progressUpdateID: number = 0;
    private _duration: number = 0;
    private _inAnimation: Animation | undefined;
    private _outAnimation: Animation | undefined;
    private _playbackRate: number = 1;
    private _gestureNavigating: boolean = false;
    private _onEnd: Function | null = null;
    private _onProgress: Function | null = null;
    private _shouldAnimate: boolean = true;

    private updateProgress() {
        
        if (this._gestureNavigating && !this._play) {
            // update in set progress() instead
            window.cancelAnimationFrame(this._progressUpdateID);
            return;
        }
        const update = () => {
            const currentTime = this._outAnimation?.currentTime || 0;
            const progress = clamp((currentTime / this._duration) * 100, 0, 100);

            this._progress = progress;

            if (this._onProgress) {
                this._onProgress(this._progress);
            }
        }

        update();

        this._progressUpdateID = window.requestAnimationFrame(this.updateProgress.bind(this));
        this._outAnimation?.finished.then(() => {
            window.cancelAnimationFrame(this._progressUpdateID);
            if (this._progress !== 100) {
                update();
            }
        });
    }

    reset() {
        this._onEnd = null;
        this._playbackRate = 1;
        this._play = true;
        this._progress = 0;
        this._gestureNavigating = false;
    }

    finish() {
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.finish();
            this._outAnimation.finish();
        }
    }

    cancel() {
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.cancel();
            this._outAnimation.cancel();
        }
    }

    async animate() {
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            if (this._gestureNavigating) {
                await this._currentScreen.mounted(true);
                this._nextScreen.pointerEvents = 'none';
                this._currentScreen.pointerEvents = 'unset';
            } else {
                this._currentScreen.pointerEvents = 'none';
                this._nextScreen.pointerEvents = 'unset';

            }

            // failing to call _onExit to disable SETs
            if (this._onExit && this._shouldAnimate) this._onExit();
            await this._nextScreen.mounted(true);

            let easingFunction = 'ease-out';
            if (this._gestureNavigating) easingFunction = 'linear';
            this._outAnimation = this._currentScreen.animate(AnimationKeyframePresets[this._currentScreen.outAnimation as keyof typeof AnimationKeyframePresets], {
                fill: 'forwards',
                duration: this._duration,
                easing: easingFunction
            });
            this._inAnimation = this._nextScreen.animate(AnimationKeyframePresets[this._nextScreen.inAnimation as keyof typeof AnimationKeyframePresets], {
                fill: 'forwards',
                duration: this._duration,
                easing: easingFunction
            });

            if (this._inAnimation && this._outAnimation) {
                if (!this._shouldAnimate) {
                    this._inAnimation.finish();
                    this._outAnimation.finish();
                    this._shouldAnimate = true;
                    return;
                }

                this._inAnimation.playbackRate = this._playbackRate;
                this._outAnimation.playbackRate = this._playbackRate;
                
                if (this._gestureNavigating) {
                    this._inAnimation.currentTime = this._duration;
                    this._outAnimation.currentTime = this._duration;
                }

                if (!this._play) {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                }

                this._outAnimation.ready.then(() => {
                    this.updateProgress();
                });
                this._outAnimation.onfinish = () => {
                    if (this._outAnimation) {
                        this._outAnimation.onfinish = null;
                    }
                    // if playback rate is 2 then gesture navigation was aborted
                    if (!this._gestureNavigating || this._playbackRate === 0.5) {
                        if (this._currentScreen) {
                            this._currentScreen.mounted(false);
                        }
                    } else {
                        if (this._currentScreen) {
                            // hotfix for weird bug that snaps screen to start position after gesture navigation
                            this._currentScreen.animate([
                                {transform: 'translate(0vw, 0vh) scale(1)', opacity: 1}
                            ], {duration: 0, fill: 'forwards'});
                        }
                        if (this._nextScreen) {
                            this._nextScreen.mounted(false);
                        }
                    }
                    if (this._onEnd) {
                        this._onEnd();
                    }

                    const endAnimationEvent = new CustomEvent('page-animation-end');
                    window.dispatchEvent(endAnimationEvent);
                }
            }
        } else {
            this._shouldAnimate = true;
        }
    }

    set onProgress(_onProgress: Function | null) {
        this._onProgress = _onProgress;
    }

    set onEnd(_onEnd: Function | null) {
        this._onEnd = _onEnd;
    }

    set shouldAnimate(_shouldAnimate: boolean)  {
        this._shouldAnimate = _shouldAnimate;
    }

    set playbackRate(_playbackRate: number) {
        this._playbackRate = _playbackRate;
        if (_playbackRate > 0) {
            // aborted gesture navigation so set pointer events back to correct setting
            if (this._currentScreen && this._nextScreen) {
                this._currentScreen.pointerEvents = 'none';
                this._nextScreen.pointerEvents = 'unset';
            }
        }
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.playbackRate = this._playbackRate;
            this._outAnimation.playbackRate = this._playbackRate;
        }
    }

    set gestureNavigating(_gestureNavigating: boolean) {
        this._gestureNavigating = _gestureNavigating;
    }

    set play(_play: boolean) {
        if (this._play !== _play) {
            this._play = _play;

            if (this._play && this._gestureNavigating) {
                this.updateProgress();
            }

            if (this._inAnimation && this._outAnimation) {
                if (_play) {
                    this._inAnimation.play();
                    this._outAnimation.play();
                } else {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                }
            }
        }
    }

    set progress(_progress: number) {
        this._progress = _progress;
        if (this._onProgress) {
            this._onProgress(this._progress);
        }
        const currentTime = (this._progress / 100) * this._duration;
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.currentTime = currentTime;
            this._outAnimation.currentTime = currentTime;
        }
    }

    set currentScreen(_screen: AnimationProvider) {
        this._currentScreen = _screen;
    }

    set nextScreen(_screen: AnimationProvider) {
        this._nextScreen = _screen;
        if (!this._currentScreen) {
            _screen.mounted(true, false);
            this._nextScreen = null;
            // this.animate(this._currentScreen, this._nextScreen);
        }
    }

    set onEnter(_onEnter: Function | undefined) {
        this._onEnter = _onEnter;
    }

    set onExit(_onExit: Function | undefined) {
        this._onExit = _onExit;
    }

    set duration(_duration: number) {
        this._duration = _duration;
    }
    get progress() {
        return this._progress;
    }

    get gestureNavigating() {
        return this._gestureNavigating;
    }
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());

interface AnimationProviderProps {
    onExit: Function;
    onEnter: Function;
    in: boolean;
    out: boolean;
    name: string;
    animation: {
        in: AnimationConfig;
        out: AnimationConfig;
    };
    backNavigating: boolean;
}

interface AnimationProviderState {
    mounted: boolean;
    pointerEvents: React.CSSProperties['pointerEvents'];
}

const OppositeDirection = {
    "left": "right" as const,
    "right": "left" as const,
    "up": "down" as const,
    "down": "up" as const,
    "in": "out" as const,
    "out": "in" as const
}

export class AnimationProvider extends React.Component<AnimationProviderProps, AnimationProviderState> {
    private _animationLayerData: AnimationLayerData | null = null;
    private ref: HTMLElement | null = null;
    private onAnimationEnd = this.animationEnd.bind(this);
    private onNavigate = this.navigate.bind(this);
    private setRef = this.onRef.bind(this);

    state: AnimationProviderState = {
        mounted: false,
        pointerEvents: 'unset'
    }
    
    onRef(ref: HTMLElement | null) {
        this.ref = ref;
    }

    animationEnd() {
        if (this.ref) this.ref.style.willChange = 'auto';
    }

    navigate() {
        if (this.ref) this.ref.style.willChange = 'transform, opacity';
    }

    componentDidMount() {
        window.addEventListener('go-back', this.onNavigate);
        window.addEventListener('navigate', this.onNavigate);
        window.addEventListener('page-animation-end', this.onAnimationEnd);
        if (this._animationLayerData) {
            if (this.props.in) {
                this._animationLayerData.onEnter = this.props.onEnter;
                this._animationLayerData.nextScreen = this;
            }
            if (this.props.out) {
                this._animationLayerData.onExit = this.props.onExit;
                this._animationLayerData.currentScreen = this;
            }
        }
    }

    componentDidUpdate(prevProps: AnimationProviderProps) {
        if (!this._animationLayerData) return;
        if (this.props.out !== prevProps.out || this.props.in !== prevProps.in) {
            if (this.props.out) {
                // set current screen and call onExit

                this._animationLayerData.onExit = this.props.onExit;
                this._animationLayerData.currentScreen = this;
            } else if (this.props.in) {
                this._animationLayerData.onEnter = this.props.onEnter;
                this._animationLayerData.nextScreen = this;
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('go-back', this.onNavigate);
        window.removeEventListener('navigate', this.onNavigate);
        window.removeEventListener('page-animation-end', this.onAnimationEnd);
    }

    get inAnimation() {
        let direction = this.props.animation.in.direction;
        let directionPrefix = '';
        const backNavigating = this.props.backNavigating;
        if (backNavigating && direction) {
            if (this.props.animation.in.type === "zoom" || this.props.animation.in.type === "slide") {
                direction = OppositeDirection[direction];
                directionPrefix = 'back-';
            }
        }
        switch(this.props.animation.in.type) {
            case "slide":
                return `slide-${directionPrefix + direction || 'left'}-in`;

            case "zoom":
                return `zoom-${direction || 'in'}-in`;
            
            case "fade":
                return "fade-in";
            
            default:
                return "none";
        }
    }

    get outAnimation(): string {
        let direction = this.props.animation.out.direction;
        let directionPrefix = '';
        const backNavigating = this.props.backNavigating;
        if (backNavigating && direction) {
            if (this.props.animation.out.type === "zoom" || this.props.animation.out.type === "slide") {
                direction = OppositeDirection[direction];
                directionPrefix = 'back-'
            }
        }
        switch(this.props.animation.out.type) {
            case "slide":
                return `slide-${directionPrefix + direction || 'left'}-out`;

            case "zoom":
                return `zoom-${direction || 'in'}-out`;
            
            case "fade":
                return "fade-out";
            
            default:
                return "none";
        }
    }

    animate(keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions | undefined): Animation | undefined {
        return this.ref?.animate(keyframes, options);
    }

    mounted(_mounted: boolean, willAnimate: boolean = true): Promise<void> {
        return new Promise((resolve, _) => {
            this.setState({mounted: _mounted}, () => {
                if (_mounted) {
                    if (willAnimate) {
                        if (this.ref) this.ref.style.willChange = 'transform, opacity';
                    }
                    const shouldScroll = Boolean(
                        (this.props.in && !this._animationLayerData?.gestureNavigating)
                        || (this.props.out && this._animationLayerData?.gestureNavigating)
                    );
                    if (this.props.onEnter) {
                        this.props.onEnter(shouldScroll);
                    }
                }

                resolve();
            });
        });
    }

    set pointerEvents(_pointerEvents: React.CSSProperties['pointerEvents']) {
        this.setState({pointerEvents: _pointerEvents});
    }

    render() {
        let gestureEndState = {};
        if (this._animationLayerData?.gestureNavigating && this.props.in) {
            gestureEndState = AnimationKeyframePresets[this.inAnimation as keyof typeof AnimationKeyframePresets][0];
        }
        if (this._animationLayerData?.gestureNavigating && this.props.out) {
            gestureEndState = AnimationKeyframePresets[this.outAnimation as keyof typeof AnimationKeyframePresets][0];
        }
        return (
            <div className="animation-provider" ref={this.setRef} style={{
                position: 'absolute',
                transformOrigin: 'center center',
                pointerEvents: this.state.pointerEvents,
                touchAction: this.state.pointerEvents,
                zIndex: this.props.in && !this.props.backNavigating ? 1 : this.props.out && this.props.backNavigating ? 1 : 0,
                ...gestureEndState // so the "old" nextScreen doesn't snap back to centre
            }}>
                <AnimationLayerDataContext.Consumer>
                    {(animationLayerData) => {
                        this._animationLayerData = animationLayerData;

                        if (this.state.mounted) {
                            return this.props.children;
                        } else {
                            return <></>;
                        }
                    }}
                </AnimationLayerDataContext.Consumer>
            </div>
        ); 
    }
}

export const Motion = createContext(0);

interface AnimationLayerProps {
    children: ScreenChild | ScreenChildren;
    currentPath: string;
    lastPath: string | null;
    duration: number;
    navigation: Navigation;
    backNavigating: boolean;
    goBack: Function;
    hysteresis: number;
    minFlingVelocity: number;
    swipeAreaWidth: number;
    disableDiscovery: boolean;
    disableBrowserRouting: boolean;
}

interface AnimationLayerState {
    currentPath: string;
    children: ScreenChild | ScreenChildren;
    progress: number;
    shouldPlay: boolean;
    gestureNavigation: boolean;
    shouldAnimate: boolean;
}

interface MotionProgressEventDetail {
    progress: number;
}

export type MotionProgressEvent = CustomEvent<MotionProgressEventDetail>;

// type of children coerces type in React.Children.map such that 'path' is available on props
export default class AnimationLayer extends React.Component<AnimationLayerProps, AnimationLayerState> {
    private onSwipeStartListener = this.onSwipeStart.bind(this);
    private onSwipeListener = this.onSwipe.bind(this);
    private onSwipeEndListener = this.onSwipeEnd.bind(this);
    private animationLayerData = new AnimationLayerData();

    state: AnimationLayerState = {
        currentPath: this.props.currentPath,
        children: this.props.children,
        progress: 0,
        shouldPlay: true,
        gestureNavigation: false,
        shouldAnimate: true
    }

    static getDerivedStateFromProps(nextProps: AnimationLayerProps, state: AnimationLayerState) {
        if (nextProps.currentPath !== state.currentPath) {
            if (!state.shouldAnimate) {
                return {
                    currentPath: nextProps.currentPath,
                    shouldAnimate: true
                };
            }
            return {
                children: React.Children.map(
                    nextProps.children,
                    (child: ScreenChild) => {
                        if (React.isValidElement(child)) {
                            if (child.props.path === nextProps.currentPath) {
                                const element = React.cloneElement(child, {...child.props, in: true, out: false});
                                return element;
                            } else if (child.props.path === state.currentPath) {
                                const element = React.cloneElement(child, {...child.props, out: true, in: false});
                                return element;
                            } else {
                                return undefined;
                            }
                        }
                    }
                ).sort((child, _) => child.props.path === nextProps.currentPath ? 1 : -1), // current screen mounts first
                currentPath: nextProps.currentPath
            }
        }
        return state;
    }

    componentDidMount() {
        this.animationLayerData.duration = this.props.duration;
        this.animationLayerData.onProgress = (_progress: number) => {
            const progress = this.props.backNavigating && !this.state.gestureNavigation ? 99 - _progress : _progress;
            this.setState({progress: clamp(progress, 0, 100)});
            
            const progressEvent = new CustomEvent<MotionProgressEventDetail>('motion-progress', {
                detail: {
                    progress: progress
                }
            });
    
            window.queueMicrotask(() => {
                dispatchEvent(progressEvent);
            });
        }

        if (!this.props.disableDiscovery) {
            window.addEventListener('swipestart', this.onSwipeStartListener);
        }
    }

    componentDidUpdate(prevProps: AnimationLayerProps) {
        if (prevProps.currentPath !== this.state.currentPath) {
            this.animationLayerData.duration = this.props.duration;
            if (!this.state.gestureNavigation) {
                this.animationLayerData.play = true;
                this.animationLayerData.animate(); // children changes committed now animate
            }

        }
    }

    componentWillUnmount() {
        if (!this.props.disableDiscovery) {
            window.removeEventListener('swipestart', this.onSwipeStartListener);
        }
    }

    onSwipeStart(ev: SwipeStartEvent) {
        // if only one child return
        if (!this.props.lastPath) return;

        if (ev.direction === "right" && ev.x < this.props.swipeAreaWidth) {
            const children = React.Children.map(
                this.props.children,
                (child: ScreenChild) => {
                    if (React.isValidElement(child)) {
                        if (child.props.path === this.props.currentPath || child.props.path === this.props.lastPath) {
                            const _in = child.props.path === this.props.currentPath ? true : false;
                            const element = React.cloneElement(child, {
                                ...child.props,
                                in: _in,
                                out: !_in
                            });
                            return element as ScreenChild;
                        }
                    } else {
                        return undefined;
                    }
                }
            ).sort((firstChild) => firstChild.props.path === this.props.currentPath ? -1 : 1);
            
            
            this.setState({
                shouldPlay: false,
                gestureNavigation: true,
                children: children
            }, () => {
                const motionStartEvent = new CustomEvent('motion-progress-start');

                this.animationLayerData.gestureNavigating = true;
                this.animationLayerData.playbackRate = -1;
                this.animationLayerData.play = false;
                this.animationLayerData.animate();
                
                window.dispatchEvent(motionStartEvent);
                window.addEventListener('swipe', this.onSwipeListener);
                window.addEventListener('swipeend', this.onSwipeEndListener);
            });
        }
    }

    onSwipe(ev: SwipeEvent) {
        if (this.state.shouldPlay) return;
        const progress = (Math.abs(ev.x - window.innerWidth) / window.innerWidth) * 100;
        this.animationLayerData.progress = progress;
    }

    onSwipeEnd(ev: SwipeEndEvent) {
        if (this.state.shouldPlay) return;
        let onEnd = null;
        const motionEndEvent = new CustomEvent('motion-progress-end');
        if (this.state.progress < this.props.hysteresis || ev.velocity > this.props.minFlingVelocity) {
            if (ev.velocity >= this.props.minFlingVelocity) {
                this.animationLayerData.playbackRate = -4;
            }
            onEnd = () => {
                if(!this.props.disableBrowserRouting) this.animationLayerData.shouldAnimate = false;
                this.animationLayerData.reset();
                this.props.goBack();
                
                this.setState({gestureNavigation: false});

                window.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, shouldAnimate: false});
        } else {
            this.animationLayerData.playbackRate = 0.5;
            onEnd = () => {
                this.animationLayerData.reset();
                
                window.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, gestureNavigation: false});
        }

        this.animationLayerData.onEnd = onEnd;
        this.animationLayerData.play = true;
        window.removeEventListener('swipe', this.onSwipeListener);
        window.removeEventListener('swipeend', this.onSwipeEndListener);
        
    }

    render() {
        return (
            <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                <Motion.Provider value={this.state.progress}>
                    {this.state.children}
                </Motion.Provider>
            </AnimationLayerDataContext.Provider>
        );
    }
}