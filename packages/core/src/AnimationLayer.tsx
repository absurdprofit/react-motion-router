import { Children, Component, cloneElement, createContext, isValidElement } from 'react';
import { SwipeEndEvent, SwipeEvent, SwipeStartEvent } from 'web-gesture-events';
import { clamp, matchRoute, includesRoute, interpolate } from './common/utils';
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
    navigation: Navigation;
    ghostLayer: GhostLayer;
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
    private progress = MAX_PROGRESS;
    private ref: HTMLDivElement | null = null;

    state: AnimationLayerState = {
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

    componentDidMount() {
        this.props.animationLayerData.onProgress = this.onProgress.bind(this);
    }

    componentDidUpdate(prevProps: AnimationLayerProps, prevState: AnimationLayerState) {
        if (prevProps.children !== this.props.children) {
            if (!this.state.gestureNavigating && prevState.shouldAnimate) {
                this.props.animationLayerData.play = true;
                this.animate();
            }
        }
    }

    private onProgress(_progress: number) {
        let progress = _progress;

        if (progress === this.progress) return;

        this.progress = progress;
        const progressEvent = new CustomEvent<MotionProgressDetail>('motion-progress', {
            detail: {progress}
        });
        if (this.props.dispatchEvent) this.props.dispatchEvent(progressEvent);
        this.forceUpdate();
    }

    private async animate() {
        await Promise.all([
            this.props.ghostLayer.setupTransition(),
            this.props.animationLayerData.setupTransition()
        ]);
        requestAnimationFrame(() => {
            this.props.ghostLayer.sharedElementTransition();
            this.props.animationLayerData.pageTransition();
        });
    }

    onGestureSuccess(
        state: Pick<AnimationLayerState, 'swipeAreaWidth' | 'swipeDirection' | 'hysteresis' | 'disableDiscovery' | 'minFlingVelocity'>,
        name: string | null
    ) {
        this.props.onDocumentTitleChange(name);
        this.setState(state);
    }

    onSwipeStart = (ev: SwipeStartEvent) => {
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
                this.props.ghostLayer.play = false;
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
        this.props.animationLayerData.progress = progress;
    }

    onSwipeEnd = (ev: SwipeEndEvent) => {
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
                this.props.onGestureNavigationEnd();
                
                this.setState({gestureNavigating: false});

                if (this.props.dispatchEvent) this.props.dispatchEvent(motionEndEvent);
                requestAnimationFrame(() => this.props.animationLayerData.reset());
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
        this.props.ghostLayer.play = true;
        this.ref?.removeEventListener('swipe', this.onSwipe);
        this.ref?.removeEventListener('swipeend', this.onSwipeEnd);
        
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
            <div
                className="animation-layer"
                ref={this.setRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    '--motion-progress': this.progress
                }  as React.CSSProperties}
            >
                <Motion.Provider value={this.progress}>
                    {this.state.children}
                </Motion.Provider>
            </div>
        );
    }
}