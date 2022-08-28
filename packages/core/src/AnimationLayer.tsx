import React, { createContext } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import { clamp, matchRoute, includesRoute } from './common/utils';
import Navigation from './NavigationBase';
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
    onDocumentTitleChange(title: string | null): void;
    swipeDirection: SwipeDirection;
    hysteresis: number;
    minFlingVelocity: number;
    swipeAreaWidth: number;
    disableDiscovery: boolean;
    disableBrowserRouting: boolean;
    dispatchEvent: ((event: Event) => boolean) | null;
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

function StateFromChildren(
    props: AnimationLayerProps,
    state: AnimationLayerState,
    currentPath: string | undefined,
    nextPath: string | undefined
) {
    const {paths} = state;
    let nextMatched = false;
    let currentMatched = false;
    let swipeDirection: SwipeDirection | undefined;
    let swipeAreaWidth: number | undefined;
    let minFlingVelocity: number | undefined;
    let hysteresis: number | undefined;
    let disableDiscovery: boolean | undefined;
    let name: string | null = null;

    if (state.paths.length) {
        if (!includesRoute(nextPath, paths) && state.paths.includes(undefined)) {
            nextPath = undefined;
        }
        if (currentPath !== '' && !includesRoute(currentPath, paths) && state.paths.includes(undefined)) {
            currentPath = undefined;
        }
    }

    const children: ScreenChild[] = [];
    let keptAliveKey: React.Key | undefined = undefined;
    // get current child
    React.Children.forEach(
        state.children, // match current child from state
        (child) => {
            if (!React.isValidElement(child)) return;
            if (
                matchRoute(child.props.resolvedPathname, nextPath)
                && (props.backNavigating || state.gestureNavigating)
            ) {
                // fetch kept alive key
                // needed since elements kept alive are apart of the DOM
                // to avoid confusing react we need to preserve this key
                if (child.props.config?.keepAlive) {
                    keptAliveKey = child.key || undefined;
                }
            }
            // match resolved pathname instead to avoid matching the next component first
            // this can happen if the same component matches both current and next paths
            if (matchRoute(child.props.resolvedPathname, currentPath)) {
                if (!currentMatched) {
                    let mountProps = {out: true, in: false};
                    if (state.gestureNavigating) mountProps = {in: true, out: false};
                    currentMatched = true;
                    children.push(
                        React.cloneElement(child, {
                            ...mountProps,
                            resolvedPathname: currentPath
                        }) as ScreenChild
                    );
                }
            }
        }
    )

    // get next child
    React.Children.forEach(
        props.children,
        (child) => {
            if (!React.isValidElement(child)) return;
            if (!state.paths.length) paths.push(child.props.path);
            
            if (matchRoute(child.props.path, nextPath)) {
                if (!nextMatched) {
                    nextMatched = true;
                    const {config} = child.props;
                    swipeDirection = config?.swipeDirection;
                    swipeAreaWidth = config?.swipeAreaWidth;
                    hysteresis = config?.hysteresis;
                    disableDiscovery = config?.disableDiscovery;
                    minFlingVelocity = config?.minFlingVelocity;
                    name = child.props.name || null;
                    let mountProps = {in: true, out: false};
                    if (state.gestureNavigating) mountProps = {out: true, in: false};
                    const key = keptAliveKey || Math.random();
                    children.push(
                        React.cloneElement(child, {
                            ...mountProps,
                            resolvedPathname: nextPath,
                            key
                        }) as ScreenChild
                    );
                }
            }
        }
    );

    return {
        paths,
        children,
        name,
        currentPath: props.currentPath,
        swipeDirection: swipeDirection || props.swipeDirection,
        swipeAreaWidth: swipeAreaWidth || props.swipeAreaWidth,
        hysteresis: hysteresis || props.hysteresis,
        disableDiscovery: disableDiscovery === undefined ? props.disableDiscovery : disableDiscovery,
        minFlingVelocity: minFlingVelocity || props.minFlingVelocity
    }
}

// type of children coerces type in React.Children.map such that 'path' is available on props
export default class AnimationLayer extends React.Component<AnimationLayerProps, AnimationLayerState> {
    private onSwipeStartListener = this.onSwipeStart.bind(this);
    private onSwipeListener = this.onSwipe.bind(this);
    private onSwipeEndListener = this.onSwipeEnd.bind(this);
    private ref: HTMLDivElement | null = null;
    static contextType = AnimationLayerDataContext;
    context!: React.ContextType<typeof AnimationLayerDataContext>;

    state: AnimationLayerState = {
        currentPath: '',
        children: this.props.children,
        progress: 0,
        shouldPlay: true,
        gestureNavigating: false,
        shouldAnimate: true,
        startX: 0,
        startY: 0,
        paths: [],
        swipeDirection: this.props.swipeDirection,
        swipeAreaWidth: this.props.swipeAreaWidth,
        minFlingVelocity: this.props.minFlingVelocity,
        hysteresis: this.props.hysteresis,
        disableDiscovery: false
    }

    static getDerivedStateFromProps(nextProps: AnimationLayerProps, state: AnimationLayerState): Partial<AnimationLayerState> | null {
        if (nextProps.currentPath !== state.currentPath) {
            if (!state.shouldAnimate) {
                return {
                    currentPath: nextProps.currentPath,
                    shouldAnimate: true
                };
            }

            let nextPath: string | undefined = nextProps.currentPath;
            
            const {name, ...nextState} = StateFromChildren(nextProps, state, state.currentPath, nextProps.currentPath);
            nextState.children.sort((child, _) => matchRoute(child.props.path, nextPath) ? 1 : -1); // current screen mounts first
            nextProps.onDocumentTitleChange(name);
            return nextState;
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
                if (this.props.dispatchEvent) this.props.dispatchEvent(progressEvent);
            });
        }

        // window.addEventListener('swipestart', this.onSwipeStartListener);
    }

    componentDidUpdate(prevProps: AnimationLayerProps, prevState: AnimationLayerState) {
        if (!React.Children.count(this.state.children)) {
            let swipeDirection: SwipeDirection | undefined;
            let swipeAreaWidth: number | undefined;
            let minFlingVelocity: number | undefined;
            let hysteresis: number | undefined;
            let disableDiscovery: boolean | undefined;
            const children = React.Children.map(this.props.children, (child: ScreenChild) => {
                if (!React.isValidElement(child)) return undefined;
                if (matchRoute(child.props.path, undefined)) {
                    const {config} = child.props;
                    swipeDirection = config?.swipeDirection;
                    swipeAreaWidth = config?.swipeAreaWidth;
                    hysteresis = config?.hysteresis;
                    disableDiscovery = config?.disableDiscovery;
                    minFlingVelocity = config?.minFlingVelocity;
                    this.props.onDocumentTitleChange(child.props.name || null);
                    return React.cloneElement(child, {in: true, out: false}) as ScreenChild;
                }
            });

            this.setState({
                children: children,
                swipeDirection: swipeDirection || this.props.swipeDirection,
                swipeAreaWidth: swipeAreaWidth || this.props.swipeAreaWidth,
                hysteresis: hysteresis || this.props.hysteresis,
                disableDiscovery: disableDiscovery === undefined ? this.props.disableDiscovery : disableDiscovery,
                minFlingVelocity: minFlingVelocity || this.props.minFlingVelocity
            });
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
        // window.removeEventListener('swipestart', this.onSwipeStartListener);
    }

    onGestureSuccess(
        state: Pick<AnimationLayerState, 'swipeAreaWidth' | 'swipeDirection' | 'hysteresis' | 'disableDiscovery' | 'minFlingVelocity'>,
        name: string | null
    ) {
        this.props.onDocumentTitleChange(name);
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
            ev.stopPropagation();
            // if gesture region in touch path return
            for (let target of ev.composedPath().reverse()) {
                if ('classList' in target && (target as HTMLElement).classList.length) {
                    if ((target as HTMLElement).classList.contains('gesture-region')) return;
                    if (target === ev.gestureTarget) break;
                }
            }

            // let currentPath: string | undefined = this.props.currentPath;
            const {children, currentPath, paths, name, ...nextState} = StateFromChildren(this.props, {...this.state, gestureNavigating: true}, this.props.currentPath, this.props.lastPath);
            
            this.onGestureSuccess = this.onGestureSuccess.bind(this, nextState, name);
            window.addEventListener('go-back', this.onGestureSuccess as unknown as EventListener, {once: true});

            this.props.onGestureNavigationStart();
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
                children: children.sort((firstChild) => matchRoute(firstChild.props.path, currentPath) ? -1 : 1),
                startX: ev.x,
                startY: ev.y
            }, () => {
                const motionStartEvent = new CustomEvent('motion-progress-start');

                this.context.gestureNavigating = true;
                this.context.playbackRate = -1;
                this.context.play = false;
                this.context.backNavigating = this.props.backNavigating;
                this.context.animate();
                
                if (this.props.dispatchEvent) this.props.dispatchEvent(motionStartEvent);
                this.ref?.addEventListener('swipe', this.onSwipeListener);
                this.ref?.addEventListener('swipeend', this.onSwipeEndListener);
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

                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, shouldAnimate: false});
        } else {
            this.context.playbackRate = 0.5;
            onEnd = () => {
                window.removeEventListener('go-back', this.onGestureSuccess as unknown as EventListener);
                this.context.reset();
                
                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, gestureNavigating: false});
        }

        this.setState({startX: 0, startY: 0});
        this.context.onEnd = onEnd;
        this.context.play = true;
        this.ref?.removeEventListener('swipe', this.onSwipeListener);
        this.ref?.removeEventListener('swipeend', this.onSwipeEndListener);
        
    }

    setRef = (ref: HTMLDivElement | null) => {
        if (this.ref) {
            this.ref.removeEventListener('swipestart', this.onSwipeStartListener);
        }

        this.ref = ref;
        
        if (ref) {
            ref.addEventListener('swipestart', this.onSwipeStartListener);
        }
    }

    render() {
        return (
            <div className="animation-layer" ref={this.setRef} style={{width: '100%', height: '100%', position: 'relative'}}>
                <Motion.Provider value={this.state.progress}>
                    {this.state.children}
                </Motion.Provider>
            </div>
        );
    }
}