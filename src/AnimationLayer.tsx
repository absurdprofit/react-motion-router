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

    private updateProgress() {
        if (this._gestureNavigating) {
            // update in set progress() instead
            window.cancelAnimationFrame(this._progressUpdateID);
        }
        const update = () => {
            const currentTime = this._outAnimation?.currentTime || 0;
            const progress = (currentTime / this._duration) * 100;

            this._progress = clamp(progress, 0, 100);
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
        this.playbackRate = 1;
        this._play = true;
        this._progress = 0;
        this._gestureNavigating = false;
    }

    cancel() {
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.cancel();
            this._outAnimation.cancel();
        }
    }

    async animate() {
        if (this._currentScreen && this._nextScreen) {
            if (this._gestureNavigating) {
                await this._currentScreen.mounted(true);
            }

            if (this._onExit) this._onExit();
            await this._nextScreen.mounted(true);

            this._outAnimation = this._currentScreen.animate(AnimationKeyframePresets[this._currentScreen.outAnimation as keyof typeof AnimationKeyframePresets], {
                fill: 'forwards',
                duration: this._duration
            });
            this._inAnimation = this._nextScreen.animate(AnimationKeyframePresets[this._nextScreen.inAnimation as keyof typeof AnimationKeyframePresets], {
                fill: 'forwards',
                duration: this._duration
            });

            if (this._inAnimation && this._outAnimation) {
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
                    if (this._currentScreen && !this.gestureNavigating) {
                        this._currentScreen.mounted(false);
                    }
                    if (this._onEnd) {
                        this._onEnd();
                    }

                    const endAnimationEvent = new CustomEvent('page-animation-end');

                    window.dispatchEvent(endAnimationEvent);
                }
            }
        }
    }

    set onProgress(_onProgress: Function | null) {
        this._onProgress = _onProgress;
    }

    set onEnd(_onEnd: Function | null) {
        this._onEnd = _onEnd;
    }

    set playbackRate(_playbackRate: number) {
        this._playbackRate = _playbackRate;
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
            _screen.mounted(true);
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
    private setRef = this.onRef.bind(this);

    state: AnimationProviderState = {
        mounted: false
    }
    
    onRef(ref: HTMLElement | null) {
        this.ref = ref;
    }

    componentDidMount() {
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
        // this.setState({mounted: this.props.in});
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

    mounted(_mounted: boolean): Promise<void> {
        return new Promise((resolve, _) => {
            this.setState({mounted: _mounted}, () => {
                if (_mounted) {
                    if (this.props.onEnter) {
                        this.props.onEnter();
                    }
                }

                resolve();
            });
        });
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
    shoudAnimate: boolean;
    currentPath: string;
    lastPath: string | null;
    duration: number;
    navigation: Navigation;
    backNavigating: boolean;
}

interface AnimationLayerState {
    currentPath: string;
    children: ScreenChild | ScreenChildren;
    progress: number;
    shouldPlay: boolean;
    gestureNavigation: boolean;
    shouldAnimate: boolean;
}

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
            return {
                children: React.Children.map(
                    nextProps.children,
                    (child: ScreenChild) => {
                        if (React.isValidElement(child)) {
                            if (child.props.path === nextProps.currentPath) {
                                const element = React.cloneElement(child, {...child.props, in: true, out: false});
                                return element;
                            } else if (child.props.path === nextProps.lastPath) {
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
            const progress = this.props.backNavigating ? 99 - _progress : _progress + 1;
            this.setState({progress: clamp(progress, 0, 100)});
        }

        window.addEventListener('swipestart', this.onSwipeStartListener, {passive: false});
        
    }

    componentDidUpdate(prevProps: AnimationLayerProps) {
        if (prevProps.currentPath !== this.state.currentPath) {
            this.animationLayerData.duration = this.props.duration;
            if (!this.state.gestureNavigation) {
                this.animationLayerData.play = true;
            }
            if (this.state.shouldAnimate) this.animationLayerData.animate();
            if (!this.state.shouldAnimate) {
                this.animationLayerData.animate();
                this.animationLayerData.progress = 100;
            }
        } else if (this.state.gestureNavigation) {
            window.addEventListener('swipe', this.onSwipeListener);
            window.addEventListener('swipeend', this.onSwipeEndListener);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('swipestart', this.onSwipeStartListener);
        
    }

    onSwipeStart(ev: SwipeStartEvent) {
        // if only one child return
        if (!this.props.lastPath) return;

        // this.animationLayerData.backNavigating = true;
        // this.animationLayerData.play = false;
        if (ev.direction === "right" && ev.x < 100) {
            const children = React.Children.map(this.state.children, (child: ScreenChild) => {
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
            }).sort((firstChild) => firstChild.props.path === this.props.currentPath ? -1 : 1);

            this.setState({
                shouldPlay: false,
                gestureNavigation: true,
                children: children
                }, () => {
                    this.animationLayerData.gestureNavigating = true;
                    this.animationLayerData.playbackRate = -1;
                    this.animationLayerData.play = false;
                    this.animationLayerData.animate();
            });
            
        }
    }

    onSwipe(ev: SwipeEvent) {
        console.log("Swipe");
        if (this.state.shouldPlay) return;
        const percentage = (Math.abs(ev.x - window.innerWidth) / window.innerWidth) * 100;
        this.animationLayerData.progress = percentage;
    }

    onSwipeEnd(ev: SwipeEndEvent) {
        if (this.state.shouldPlay) return;
        // this.animationLayerData.progress = this.state.progress;
        let onEnd = null;
        if (this.state.progress < 50) {
            onEnd = () => {
                this.setState({shouldAnimate: false}, () => {
                    this.props.navigation.goBack();
                });
                // this.animationLayerData.reset();
                this.animationLayerData.progress = 1;
                this.animationLayerData.onEnd = null;
                this.animationLayerData.gestureNavigating = false;
            }
            this.animationLayerData.playbackRate = -1;
            this.setState({shouldPlay: true, gestureNavigation: false});
        } else {
            this.animationLayerData.playbackRate = 2;
            onEnd = () => {
                this.animationLayerData.progress = 1;
                this.animationLayerData.onEnd = null;
                this.animationLayerData.gestureNavigating = false;
                // this.animationLayerData.reset();
            }
            this.setState({shouldPlay: true, gestureNavigation: false});
        }

        this.animationLayerData.onEnd = onEnd;
        this.animationLayerData.play = true;
        window.removeEventListener('swipe', this.onSwipeListener);
        window.removeEventListener('swipeend', this.onSwipeEndListener);
        // this.animationLayerData.animate();
        
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