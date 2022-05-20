import React, { createContext } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import { clamp, matchRoute, includesRoute } from './common/utils';
import Navigation from './Navigation';
import {ScreenChild} from './index';
import {AnimationLayerDataContext} from './AnimationLayerData';
import { MotionProgressDetail } from './MotionEvents';
import { SwipeDirection } from './common/types';

export const Motion = createContext(0);

interface AnimationLayerProps {
    children: ScreenChild | ScreenChild[];
    currentPath: string;
    lastPath: string | null;
    navigation: Navigation;
    backNavigating: boolean;
    onGestureNavigationEnd: Function;
    onGestureNavigationStart: Function;
    swipeDirection: SwipeDirection;
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
    startY: number;
    paths: (string | RegExp | undefined)[],
    swipeDirection: SwipeDirection;
    swipeAreaWidth: number;
    minFlingVelocity: number;
    hysteresis: number;
    disableDiscovery: boolean;
}

// type of children coerces type in React.Children.map such that 'path' is available on props
export default class AnimationLayer extends React.Component<AnimationLayerProps, AnimationLayerState> {
    private onSwipeStartListener = this.onSwipeStart.bind(this);
    private onSwipeListener = this.onSwipe.bind(this);
    private onSwipeEndListener = this.onSwipeEnd.bind(this);
    static contextType = AnimationLayerDataContext;
    context!: React.ContextType<typeof AnimationLayerDataContext>;

    state: AnimationLayerState = {
        currentPath: this.props.currentPath,
        children: this.props.children,
        progress: 0,
        shouldPlay: true,
        gestureNavigating: false,
        shouldAnimate: true,
        startX: 0,
        startY: 0,
        paths: [],
        swipeDirection: 'right',
        swipeAreaWidth: 100,
        minFlingVelocity: 400,
        hysteresis: 50,
        disableDiscovery: false
    }

    static getDerivedStateFromProps(nextProps: AnimationLayerProps, state: AnimationLayerState): AnimationLayerState | null {
        if (nextProps.currentPath !== state.currentPath) {
            if (!state.shouldAnimate) {
                return {
                    ...state,
                    currentPath: nextProps.currentPath,
                    shouldAnimate: true
                };
            }

            const paths = [...state.paths];
            let nextPath: string | undefined = nextProps.currentPath;
            let currentPath: string | undefined = state.currentPath; // === '' when AnimationLayer first mounts
            let nextMatched = false;
            let currentMatched = false;
            let swipeDirection: SwipeDirection | undefined;
            let swipeAreaWidth: number | undefined;
            let minFlingVelocity: number | undefined;
            let hysteresis: number | undefined;
            let disableDiscovery: boolean | undefined;
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
                                const {config} = child.props;
                                swipeDirection = config?.swipeDirection;
                                swipeAreaWidth = config?.swipeAreaWidth;
                                hysteresis = config?.hysteresis;
                                disableDiscovery = config?.disableDiscovery;
                                minFlingVelocity = config?.minFlingVelocity;
                                return React.cloneElement(child, {...child.props, in: true, out: false}) as ScreenChild;
                            }
                        }
                        if (matchRoute(child.props.path, currentPath)) {
                            if (!currentMatched) {
                                currentMatched = true;
                                return React.cloneElement(child, {...child.props, out: true, in: false}) as ScreenChild;
                            }
                        }
                    }
                }
            ).sort((child, _) => matchRoute(child.props.path, nextPath) ? 1 : -1); // current screen mounts first

            return {
                ...state,
                paths: paths,
                children: children,
                currentPath: nextProps.currentPath,
                swipeDirection: swipeDirection || nextProps.swipeDirection,
                swipeAreaWidth: swipeAreaWidth || nextProps.swipeAreaWidth,
                hysteresis: hysteresis || nextProps.hysteresis,
                disableDiscovery: disableDiscovery === undefined ? nextProps.disableDiscovery : disableDiscovery,
                minFlingVelocity: minFlingVelocity || nextProps.minFlingVelocity
            }
        }
        return null;
    }

    componentDidMount() {
        this.context.onProgress = (_progress: number) => {
            const progress = this.props.backNavigating && !this.state.gestureNavigating ? 99 - _progress : _progress;
            this.setState({progress: clamp(progress, 0, 100)});
            
            const progressEvent = new CustomEvent<MotionProgressDetail>('motion-progress', {
                detail: {
                    progress: progress
                }
            });
    
            window.queueMicrotask(() => {
                dispatchEvent(progressEvent);
            });
        }

        window.addEventListener('swipestart', this.onSwipeStartListener);
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
            if (!this.state.gestureNavigating && prevState.shouldAnimate) {
                this.context.play = true;
                this.context.backNavigating = this.props.backNavigating;
                this.context.animate(); // children changes committed now animate
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('swipestart', this.onSwipeStartListener);
    }

    onGestureSuccess(state: Pick<AnimationLayerState, 'swipeAreaWidth' | 'swipeDirection' | 'hysteresis' | 'disableDiscovery' | 'minFlingVelocity'>) {
        this.setState(state);
    }

    onSwipeStart(ev: SwipeStartEvent) {
        if (this.state.disableDiscovery) return;
        if (this.context.isPlying) return;
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
            if (!this.props.lastPath) return;

            // if gesture region in touch path return
            for (let target of ev.composedPath().reverse()) {
                if ('classList' in target && (target as HTMLElement).classList.length) {
                    if ((target as HTMLElement).classList.contains('gesture-region')) return;
                    if (target === ev.gestureTarget) break;
                }
            }

            let currentPath: string | undefined = this.props.currentPath;
            let lastPath: string | undefined = this.props.lastPath;
            let currentMatched = false;
            let lastMatched = false;
            let swipeDirection: SwipeDirection | undefined;
            let swipeAreaWidth: number | undefined;
            let minFlingVelocity: number | undefined;
            let hysteresis: number | undefined;
            let disableDiscovery: boolean | undefined;
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
                                const {config} = child.props;
                                swipeDirection = config?.swipeDirection;
                                swipeAreaWidth = config?.swipeAreaWidth;
                                hysteresis = config?.hysteresis;
                                disableDiscovery = config?.disableDiscovery;
                                minFlingVelocity = config?.minFlingVelocity;
                                const element = React.cloneElement(child, {...child.props, in: false, out: true});
                                return element as ScreenChild;
                            }
                        }
                    }
                }
            ).sort((firstChild) => matchRoute(firstChild.props.path, currentPath) ? -1 : 1);

            this.onGestureSuccess = this.onGestureSuccess.bind(this, {
                swipeDirection: swipeDirection || this.props.swipeDirection,
                swipeAreaWidth: swipeAreaWidth || this.props.swipeAreaWidth,
                hysteresis: hysteresis || this.props.hysteresis,
                disableDiscovery: disableDiscovery === undefined ? this.props.disableDiscovery : disableDiscovery,
                minFlingVelocity: minFlingVelocity || this.props.minFlingVelocity
            });
            window.addEventListener('go-back', this.onGestureSuccess as unknown as EventListener, {once: true});

            this.props.onGestureNavigationStart();
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
                children: children,
                startX: ev.x,
                startY: ev.y
            }, () => {
                const motionStartEvent = new CustomEvent('motion-progress-start');

                this.context.gestureNavigating = true;
                this.context.playbackRate = -1;
                this.context.play = false;
                this.context.backNavigating = this.props.backNavigating;
                this.context.animate();
                
                window.dispatchEvent(motionStartEvent);
                window.addEventListener('swipe', this.onSwipeListener);
                window.addEventListener('swipeend', this.onSwipeEndListener);
            });
        }
    }

    onSwipe(ev: SwipeEvent) {
        if (this.state.shouldPlay) return;
        let progress: number;
        switch(this.state.swipeDirection) {
            case "left":
            case "right": {
                // left or right
                const width = window.innerWidth;
                const x = clamp(ev.x - this.state.startX, 10);
                progress = (-(x - width) / width) * 100;
                if (this.state.swipeDirection === "left") progress = 100 - progress;
                break;
            }

            case "up":
            case "down": {
                const height = window.innerHeight;
                const y = clamp(ev.y - this.state.startY, 10);
                if (y < 0) alert(y);
                progress = (-(y - height) / height) * 100;
                if (this.state.swipeDirection === "up") progress = 100 - progress;
                break;
            }
                
        }
        this.context.progress = clamp(progress, 0.1, 100);
    }

    onSwipeEnd(ev: SwipeEndEvent) {
        if (this.state.shouldPlay) return;
        
        let onEnd = null;
        const motionEndEvent = new CustomEvent('motion-progress-end');
        if ((100 - this.state.progress) > this.state.hysteresis || ev.velocity > this.state.minFlingVelocity) {
            if (ev.velocity >= this.state.minFlingVelocity) {
                this.context.playbackRate = -5;
            } else {
                this.context.playbackRate = -1;
            }
            onEnd = () => {
                this.context.reset();
                this.props.onGestureNavigationEnd();
                
                this.setState({gestureNavigating: false});

                window.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, shouldAnimate: false});
        } else {
            this.context.playbackRate = 0.5;
            onEnd = () => {
                window.removeEventListener('go-back', this.onGestureSuccess as unknown as EventListener);
                this.context.reset();
                
                window.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, gestureNavigating: false});
        }

        this.setState({startX: 0, startY: 0});
        this.context.onEnd = onEnd;
        this.context.play = true;
        window.removeEventListener('swipe', this.onSwipeListener);
        window.removeEventListener('swipeend', this.onSwipeEndListener);
        
    }

    render() {
        return (
            <Motion.Provider value={this.state.progress}>
                {this.state.children}
            </Motion.Provider>
        );
    }
}