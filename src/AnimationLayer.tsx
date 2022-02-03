import React, { createContext } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import { ScreenChild, ScreenChildren } from '.';
import AnimationKeyframePresets from './Animations';
import { AnimationConfig } from './Router';

// export interface ScreenMap {
//     [key:string]: Stack.Screen;
// }

// export class AnimationLayerScene {
//     private _screens: ScreenMap = {};
    
//     addScreen(screen: Stack.Screen, name: string) {
//         this._screens[name] = screen;
//     }

//     removeScreen(name: string) {
//         delete this._screens[name];
//     }

//     get screens() {
//         return this._screens;
//     }
// }



export class AnimationLayerData {
    private _progress: number = 0;
    private _playing: boolean = false;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _onExit: Function | undefined;
    private _onEnter: Function | undefined;
    private _duration: number = 0;

    animate() {
        if (this._currentScreen && this._nextScreen) {
            // currentScreen.mounted = false;
            this._nextScreen.mounted = true;
            if (this._onExit) this._onExit();

            const outAnimation = this._currentScreen.animate(AnimationKeyframePresets[this._currentScreen.outAnimation as keyof typeof AnimationKeyframePresets], {
                duration: this._duration,
                fill: 'forwards'
            });
            const inAnimation = this._nextScreen.animate(AnimationKeyframePresets[this._nextScreen.inAnimation as keyof typeof AnimationKeyframePresets], {
                duration: this._duration,
                fill: 'forwards'
            });

            if (inAnimation) {
            }
            if (outAnimation) {
                outAnimation.onfinish = () => {
                    if (this._currentScreen) {
                        this._currentScreen.mounted = false;
                    }
                }
            }
        }
    }

    set playing(_playing: boolean) {
        this._playing = _playing;
    }

    set currentScreen(_screen: AnimationProvider) {
        this._currentScreen = _screen;
    }

    set nextScreen(_screen: AnimationProvider) {
        this._nextScreen = _screen;
        if (!this._currentScreen) {
            _screen.mounted = true;
            if (this._onEnter) this._onEnter();
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
        if (this.props.backNavigating && direction) {
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
        if (this.props.backNavigating && direction) {
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

    set mounted(_mounted: boolean) {
        this.setState({mounted: _mounted}, () => {
            if (_mounted) {
                if (this.props.onEnter) {
                    this.props.onEnter();
                }
            }
        });
    }

    render() {
        return (
            <div className="animation-provider" ref={this.setRef} style={{
                zIndex: this.props.in && !this.props.backNavigating ? 1 : this.props.out && this.props.backNavigating ? 1 : 0
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

interface AnimationLayerProps {
    children: ScreenChild | ScreenChildren;
    shoudAnimate: boolean;
    currentPath: string;
    duration: number;
}

interface AnimationLayerState {
    currentPath: string;
    children: ScreenChild | ScreenChildren;
}

// type of children coerces type in React.Children.map such that 'path' is available on props
export default class AnimationLayer extends React.Component<AnimationLayerProps, AnimationLayerState> {
    private onSwipeStartListener = this.onSwipeStart.bind(this);
    private onSwipeListener = this.onSwipe.bind(this);
    private onSwipeEndListener = this.onSwipeEnd.bind(this);
    private animationLayerData = new AnimationLayerData();

    state: AnimationLayerState = {
        currentPath: this.props.currentPath,
        children: this.props.children
    }

    componentDidMount() {
        window.addEventListener('swipestart', this.onSwipeStartListener);
        window.addEventListener('swipe', this.onSwipeListener);
        window.addEventListener('swipeend', this.onSwipeEndListener);
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

    componentDidUpdate(prevProps: AnimationLayerProps) {
        if (prevProps.currentPath !== this.state.currentPath) {
            this.animationLayerData.duration = this.props.duration;
            this.animationLayerData.animate();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('swipestart', this.onSwipeStartListener);
        window.removeEventListener('swipe', this.onSwipeListener);
        window.removeEventListener('swipeend', this.onSwipeEndListener);
    }

    onSwipeStart(ev: SwipeStartEvent) {

    }

    onSwipe(ev: SwipeEvent) {
    
    }

    onSwipeEnd(ev: SwipeEndEvent) {

    }

    render() {
        return (
            <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                {this.state.children}
            </AnimationLayerDataContext.Provider>
        );
    }
}