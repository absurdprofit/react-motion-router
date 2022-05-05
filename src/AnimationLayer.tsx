import React, { createContext, startTransition } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import { clamp, Navigation, matchRoute, includesRoute } from './common/utils';
import {ScreenChild} from './index';
import AnimationLayerData, {AnimationLayerDataContext} from './AnimationLayerData';
import GestureRegionRegistryContext, { GestureRegionRegistry } from './GestureRegionRegistry';

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
    startX: number;
    paths: (string | RegExp | undefined)[]
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
    private gestureRegionRegistry: GestureRegionRegistry | null = null;

    state: AnimationLayerState = {
        currentPath: this.props.currentPath,
        children: this.props.children,
        progress: 0,
        shouldPlay: true,
        gestureNavigating: false,
        shouldAnimate: true,
        startX: 0,
        paths: []
    }

    static getDerivedStateFromProps(nextProps: AnimationLayerProps, state: AnimationLayerState) {
        if (nextProps.currentPath !== state.currentPath) {
            if (!state.shouldAnimate) {
                return {
                    currentPath: nextProps.currentPath,
                    shouldAnimate: true
                };
            }

            const paths = [...state.paths];
            let nextPath: string | undefined = nextProps.currentPath;
            let currentPath: string | undefined = state.currentPath; // === '' when AnimationLayer first mounts
            let nextMatched = false;
            let currentMatched = false;
            let children = React.Children.map(
                nextProps.children,
                (child: ScreenChild) => {
                    if (React.isValidElement(child)) {
                        if (!state.paths.length) paths.push(child.props.path);
                        
                        if (state.paths.length) {
                            if (!includesRoute(nextPath, paths) && state.paths.includes(undefined)) {
                                nextPath = undefined;
                            }
                            if (currentPath !== '' && !includesRoute(currentPath, paths) && state.paths.includes(undefined)) {
                                currentPath = undefined;
                            }
                        }

                        if (matchRoute(child.props.path, nextPath)) {
                            if (!nextMatched) {
                                nextMatched = true;
                                return React.cloneElement(child, {...child.props, in: true, out: false});
                            }
                        }
                        if (matchRoute(child.props.path, currentPath)) {
                            if (!currentMatched) {
                                currentMatched = true;
                                return React.cloneElement(child, {...child.props, out: true, in: false});
                            }
                        }
                    }
                }
            ).sort((child, _) => matchRoute(child.props.path, nextPath) ? 1 : -1); // current screen mounts first

            return {
                paths: paths,
                children: children,
                currentPath: nextProps.currentPath
            }
        }
        return null;
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

    componentDidUpdate(prevProps: AnimationLayerProps, prevState: AnimationLayerState) {
        if (!React.Children.count(this.state.children)) {
            const children = React.Children.map(this.props.children, (child: ScreenChild) => {
                if (!React.isValidElement(child)) return undefined;
                if (matchRoute(child.props.path, undefined))
                return React.cloneElement(child, {...child.props, in: true, out: false}) as ScreenChild;
            });
            this.setState({children: children});
        }
        if (prevProps.currentPath !== this.state.currentPath) {
            this.animationLayerData.duration = this.props.duration;
            if (!this.state.gestureNavigating && prevState.shouldAnimate) {
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
        if (ev.direction === "right" && ev.x < this.props.swipeAreaWidth) {
            console.log(ev.x, ev.y);
            if (this.gestureRegionRegistry) {
                if (this.gestureRegionRegistry.isIntersecting(ev.x, ev.y)) {
                    return;
                }
            }
            // if only one child return
            if (!this.props.lastPath) return;
            let currentPath: string | undefined = this.props.currentPath;
            let lastPath: string | undefined = this.props.lastPath;
            let currentMatched = false;
            let lastMatched = false;
            const children = React.Children.map(
                this.props.children,
                (child: ScreenChild) => {
                    if (!this.props.lastPath) return undefined;
                    
                    if (!includesRoute(currentPath, this.state.paths) && this.state.paths.includes(undefined)) {
                        currentPath = undefined;
                    }
                    if (!includesRoute(lastPath, this.state.paths) && this.state.paths.includes(undefined)) {
                        lastPath = undefined;
                    }
                    if (React.isValidElement(child)) {
                        if (matchRoute(child.props.path, currentPath)) {
                            if (!currentMatched) {
                                currentMatched = true;
                                const element = React.cloneElement(child, {...child.props, in: true, out: false});
                                return element as ScreenChild;
                            }
                        }
                        if (matchRoute(child.props.path, lastPath)) {
                            if (!lastMatched) {
                                lastMatched = true;
                                const element = React.cloneElement(child, {...child.props, in: false, out: true});
                                return element as ScreenChild;
                            }
                        }
                    }
                }
            ).sort((firstChild) => matchRoute(firstChild.props.path, currentPath) ? -1 : 1);
            
            this.props.onGestureNavigationStart();
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
                children: children,
                startX: ev.x
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
        const width = window.innerWidth;
        const x = ev.x - this.state.startX;
        const progress = (-(x - width) / width) * 100;
        this.animationLayerData.progress = clamp(progress, 0.1, 100);
    }

    onSwipeEnd(ev: SwipeEndEvent) {
        if (this.state.shouldPlay) return;
        
        let onEnd = null;
        const motionEndEvent = new CustomEvent('motion-progress-end');
        if (this.state.progress < this.props.hysteresis || ev.velocity > this.props.minFlingVelocity) {
            if (ev.velocity >= this.props.minFlingVelocity) {
                this.animationLayerData.playbackRate = -5;
            } else {
                this.animationLayerData.playbackRate = -1;
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

        this.setState({startX: 0});
        this.animationLayerData.onEnd = onEnd;
        this.animationLayerData.play = true;
        window.removeEventListener('swipe', this.onSwipeListener);
        window.removeEventListener('swipeend', this.onSwipeEndListener);
        
    }

    render() {
        return (
            <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                <Motion.Provider value={this.state.progress}>
                    <GestureRegionRegistryContext.Consumer>
                        {(gestureRegionRegistry) => {
                            this.gestureRegionRegistry = gestureRegionRegistry;
                            return this.state.children;
                        }}
                    </GestureRegionRegistryContext.Consumer>
                </Motion.Provider>
            </AnimationLayerDataContext.Provider>
        );
    }
}