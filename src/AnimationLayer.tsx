import React, { createContext } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import { clamp, Navigation } from './common/utils';
import {ScreenChild} from './index';
import AnimationLayerData, {AnimationLayerDataContext} from './AnimationLayerData';

export const Motion = createContext(0);

interface AnimationLayerProps {
    children: ScreenChild | ScreenChild[];
    currentPath: string;
    lastPath: string | null;
    duration: number;
    navigation: Navigation;
    backNavigating: boolean;
    onGestureNavigationEnd: Function;
    onGestureNavigationStart: Function;
    hysteresis: number;
    minFlingVelocity: number;
    swipeAreaWidth: number;
    disableDiscovery: boolean;
    disableBrowserRouting: boolean;
}

interface AnimationLayerState {
    currentPath: string;
    children: ScreenChild | ScreenChild[];
    progress: number;
    shouldPlay: boolean;
    gestureNavigating: boolean;
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
        gestureNavigating: false,
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
            const progress = this.props.backNavigating && !this.state.gestureNavigating ? 99 - _progress : _progress;
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
            if (!this.state.gestureNavigating) {
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
            
            this.props.onGestureNavigationStart();
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
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
        const progress = (-(ev.x - window.innerWidth) / window.innerWidth) * 100;
        this.animationLayerData.progress = clamp(progress, 0.1, 100);
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
                this.props.onGestureNavigationEnd();
                
                this.setState({gestureNavigating: false});

                window.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, shouldAnimate: false});
        } else {
            this.animationLayerData.playbackRate = 0.5;
            onEnd = () => {
                this.animationLayerData.reset();
                
                window.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, gestureNavigating: false});
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