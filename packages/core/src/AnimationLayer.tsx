import { Children, Component, cloneElement, createContext, isValidElement } from 'react';
import { SwipeEndEvent, SwipeEvent, SwipeStartEvent } from 'web-gesture-events';
import { clamp, matchRoute, includesRoute, MatchedRoute, interpolate } from './common/utils';
import Navigation from './NavigationBase';
import { NavigationBase, ScreenChild } from './index';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import { MotionProgressDetail } from './MotionEvents';
import { SwipeDirection } from './common/types';
import { MAX_PROGRESS, MIN_PROGRESS } from './common/constants';
import GhostLayer from './GhostLayer';

export const Motion = createContext(0);

interface AnimationLayerProps {
    animationLayerData: AnimationLayerData;
    children: ScreenChild | ScreenChild[];
    currentPath: string;
    lastPath: string | null;
    navigation: Navigation;
    ghostLayer: GhostLayer;
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
    dispatchEvent: ((event: Event) => Promise<boolean>) | null;
}

interface AnimationLayerState {
    currentPath: string | null;
    children: ScreenChild | ScreenChild[];
    shouldPlay: boolean;
    gestureNavigating: boolean;
    shouldAnimate: boolean;
    startX: number;
    startY: number;
    paths: (string | undefined)[],
    swipeDirection: SwipeDirection;
    swipeAreaWidth: number;
    minFlingVelocity: number;
    hysteresis: number;
    disableDiscovery: boolean;
}

function StateFromChildren(
    props: AnimationLayerProps,
    state: AnimationLayerState,
    currentPath: string | null | undefined,
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
        if (currentPath !== null && !includesRoute(currentPath, paths) && state.paths.includes(undefined)) {
            currentPath = undefined;
        }
    }

    const children: ScreenChild[] = [];
    let keptAliveKey: React.Key | undefined = undefined;
    // get current child
    Children.forEach(
        state.children, // match current child from state
        (child) => {
            if (currentPath === null) return;
            if (!isValidElement(child)) return;
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
            let matchInfo;
            if (props.children === state.children) {
                // first load so resolve by path instead of resolvedPathname
                if (child.props.config?.keepAlive) {
                    // only match screens with keep alive.
                    matchInfo = matchRoute(child.props.path, currentPath);
                }
            } else {
                matchInfo = matchRoute(child.props.resolvedPathname, currentPath);
            }
            if (matchInfo) {
                if (!currentMatched) {
                    let mountProps = {out: true, in: false};
                    if (state.gestureNavigating) mountProps = {in: true, out: false};
                    currentMatched = true;
                    children.push(
                        cloneElement(child, {
                            ...mountProps,
                            animationLayerData: props.animationLayerData,
                            resolvedPathname: matchInfo.matchedPathname,
                            key: child.key ?? Math.random()
                        }) as ScreenChild
                    );
                }
            }
        }
    )

    // get next child
    Children.forEach(
        props.children,
        (child) => {
            if (!isValidElement(child)) return;
            if (!state.paths.length) paths.push(child.props.path);
            const matchInfo = matchRoute(child.props.path, nextPath);
            if (matchInfo) {
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
                        cloneElement(child, {
                            ...mountProps,
                            animationLayerData: props.animationLayerData,
                            resolvedPathname: matchInfo.matchedPathname,
                            key
                        }) as ScreenChild
                    );
                }
            }
        }
    );

    // not found case
    if (!children.some((child) => child.props.in)) {
        const children = Children.map(props.children, (child: ScreenChild) => {
            if (!isValidElement(child)) return undefined;
            if (matchRoute(child.props.path, undefined)) {
                const {config} = child.props;
                swipeDirection = config?.swipeDirection;
                swipeAreaWidth = config?.swipeAreaWidth;
                hysteresis = config?.hysteresis;
                disableDiscovery = config?.disableDiscovery;
                minFlingVelocity = config?.minFlingVelocity;
                name = child.props.name ?? null;
                return cloneElement(
                    child, {
                        in: true,
                        out: false,
                        animationLayerData: props.animationLayerData,
                    }
                ) as ScreenChild;
            }
        });

        return {
            children,
            name,
            currentPath: props.currentPath,
            swipeDirection: swipeDirection || props.swipeDirection,
            swipeAreaWidth: swipeAreaWidth || props.swipeAreaWidth,
            hysteresis: hysteresis || props.hysteresis,
            disableDiscovery: disableDiscovery === undefined ? props.disableDiscovery : disableDiscovery,
            minFlingVelocity: minFlingVelocity || props.minFlingVelocity
        };
    }

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

// type of children coerces type in Children.map such that 'path' is available on props
export default class AnimationLayer extends Component<AnimationLayerProps, AnimationLayerState> {
    private onSwipeStartListener = this.onSwipeStart.bind(this);
    private onSwipeListener = this.onSwipe.bind(this);
    private onSwipeEndListener = this.onSwipeEnd.bind(this);
    private progress = MAX_PROGRESS;
    private ref: HTMLDivElement | null = null;

    state: AnimationLayerState = {
        currentPath: this.props.lastPath,
        children: this.props.children,
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
        this.props.animationLayerData.onProgress = this.onProgress.bind(this);
    }

    componentDidUpdate(prevProps: AnimationLayerProps, prevState: AnimationLayerState) {
        if (prevProps.currentPath !== this.state.currentPath) {
            this.props.animationLayerData.backNavigating = this.props.backNavigating;
            if (!this.state.gestureNavigating && prevState.shouldAnimate) {
                this.props.animationLayerData.play = true;
                this.animate();
            }
        }
    }

    private onProgress(_progress: number) {
        let progress = _progress;
        if (this.props.backNavigating && !this.state.gestureNavigating)
            progress = interpolate(_progress, [MIN_PROGRESS, MAX_PROGRESS], [MAX_PROGRESS, MIN_PROGRESS]); // progress is from 100-0 when going back

        if (progress === this.progress) return;

        this.progress = progress;
        const progressEvent = new CustomEvent<MotionProgressDetail>('motion-progress', {
            detail: {progress}
        });
        if (this.props.dispatchEvent) this.props.dispatchEvent(progressEvent);
        this.forceUpdate();
    }

    private animate() {
        requestAnimationFrame(async () => {
            const start = performance.now();
            await Promise.all([
                this.props.ghostLayer.setupTransition(),
                this.props.animationLayerData.setupTransition()
            ]);
            this.props.ghostLayer.sharedElementTransition();
            this.props.animationLayerData.pageTransition(); // children changes committed now animate
            const end = performance.now();
            console.log(`animation took ${end - start}ms`);
        });
    }

    onGestureSuccess(
        state: Pick<AnimationLayerState, 'swipeAreaWidth' | 'swipeDirection' | 'hysteresis' | 'disableDiscovery' | 'minFlingVelocity'>,
        name: string | null
    ) {
        this.props.onDocumentTitleChange(name);
        this.setState(state);
    }

    onSwipeStart(ev: SwipeStartEvent) {
        if (ev.touches.length > 1) return; // disable if more than one finger engaged
        if (this.state.disableDiscovery) return;
        if (this.props.animationLayerData.isPlaying) return;
        if (this.props.animationLayerData.duration === 0) return;
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
                    if (
                        (target as HTMLElement).classList.contains('gesture-region')
                        && (target as HTMLElement).dataset.disabled === "true"
                    ) return;
                    if (target === ev.gestureTarget) break;
                }
            }

            const {children, currentPath, paths, name, ...nextState} = StateFromChildren(this.props, {...this.state, gestureNavigating: true}, this.props.currentPath, this.props.lastPath);
            
            this.onGestureSuccess = this.onGestureSuccess.bind(this, nextState, name);
            this.props.navigation.addEventListener('go-back', this.onGestureSuccess as unknown as EventListener, {once: true});

            this.props.onGestureNavigationStart();
            this.setState({
                shouldPlay: false,
                gestureNavigating: true,
                children: children.sort((firstChild) => matchRoute(firstChild.props.path, currentPath) ? -1 : 1),
                startX: ev.x,
                startY: ev.y
            }, () => {
                const motionStartEvent = new CustomEvent('motion-progress-start');

                this.props.animationLayerData.gestureNavigating = true;
                this.props.animationLayerData.playbackRate = -1;
                this.props.animationLayerData.play = false;
                this.props.animationLayerData.backNavigating = this.props.backNavigating;
                this.animate();
                
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
        this.props.animationLayerData.progress = progress;
    }

    onSwipeEnd(ev: SwipeEndEvent) {
        if (this.state.shouldPlay) return;
        
        let onEnd = null;
        const motionEndEvent = new CustomEvent('motion-progress-end');
        if ((100 - this.progress) > this.state.hysteresis || ev.velocity > this.state.minFlingVelocity) {
            if (ev.velocity >= this.state.minFlingVelocity) {
                this.props.animationLayerData.playbackRate = -5;
            } else {
                this.props.animationLayerData.playbackRate = -1;
            }
            onEnd = () => {
                this.props.animationLayerData.reset();
                this.props.onGestureNavigationEnd();
                
                this.setState({gestureNavigating: false});

                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, shouldAnimate: false});
        } else {
            this.props.animationLayerData.playbackRate = 0.5;
            onEnd = () => {
                this.props.navigation.removeEventListener('go-back', this.onGestureSuccess as unknown as EventListener);
                this.props.animationLayerData.reset();
                
                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
            }
            this.setState({shouldPlay: true, gestureNavigating: false});
        }

        this.setState({startX: 0, startY: 0});
        this.props.animationLayerData.onEnd = onEnd;
        this.props.animationLayerData.play = true;
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
            <div
                className="animation-layer"
                ref={this.setRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    [`--${this.props.navigation.routerId}-motion-progress`]: this.progress
                }  as React.CSSProperties}
            >
                <Motion.Provider value={this.progress}>
                    {this.state.children}
                </Motion.Provider>
            </div>
        );
    }
}