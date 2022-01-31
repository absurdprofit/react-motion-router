import React, { createContext } from 'react';
import {SwipeEndEvent, SwipeEvent, SwipeStartEvent} from 'web-gesture-events';
import AnimationKeyframePresets from './Animations';
import { Stack } from './Stack';

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

    private animate(currentScreen: AnimationProvider, nextScreen: AnimationProvider) {
        setTimeout(() => {
            if (currentScreen) {
                currentScreen.mounted = false;
                currentScreen.forceUpdate();
            }
            if (nextScreen) {
                nextScreen.mounted = true;
                nextScreen.forceUpdate();
            }
        }, 250);
    }

    set playing(_playing: boolean) {
        this._playing = _playing;
    }

    set currentScreen(_screen: AnimationProvider) {
        this._currentScreen = _screen;
    }

    set nextScreen(_screen: AnimationProvider) {
        this._nextScreen = _screen;
        if (this._currentScreen) {
            this.animate(this.currentScreen, this._nextScreen);
        } else {
            _screen.mounted = true;
            _screen.forceUpdate();

            this._nextScreen = null;
        }
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
}

interface AnimationProviderState {
    mounted: boolean;
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
        if (this.props.in) {
            if (this.props.onEnter) this.props.onEnter();
        }

        this.setState({mounted: this.props.in});
    }

    shouldComponentUpdate(nextProps: AnimationProviderProps) {
        if (this.props.in !== nextProps.in && this._animationLayerData) {
            if (nextProps.in) {
                // set next screen and call onEnter
                this._animationLayerData.nextScreen = this;
                if (this.props.onEnter) {
                    this.props.onEnter();
                }
            } else {
                // set current screen and call onExit
                this._animationLayerData.currentScreen = this;
                if (this.props.onExit) {
                    this.props.onExit();
                }
            }

            return true;
        }

        return false;
    }

    animate(keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions | undefined): Animation | undefined {
        return this.ref?.animate(keyframes, options);
    }

    set mounted(_mounted: boolean) {
        this.setState({mounted: _mounted});
    }

    render() {
        return (
            <AnimationLayerDataContext.Consumer>
                {(animationLayerData) => {
                    this._animationLayerData = animationLayerData;

                    if (this.props.in) {
                        return (
                            <div className="animation-privder" ref={this.setRef}>
                                {this.props.children}
                            </div>
                        );
                    } else {
                        return <></>;
                    }
                }}
            </AnimationLayerDataContext.Consumer>
        );
    }
}

interface AnimationLayerProps {
    children: React.ReactElement<Stack.Screen> | React.ReactElement<Stack.Screen>[];
    shoudAnimate: boolean;
    currentPath: string;
}

export default class AnimationLayer extends React.Component<AnimationLayerProps, {}> {
    private onSwipeStartListener = this.onSwipeStart.bind(this);
    private onSwipeListener = this.onSwipe.bind(this);
    private onSwipeEndListener = this.onSwipeEnd.bind(this);
    private animationLayerData = new AnimationLayerData();

    componentDidMount() {
        window.addEventListener('swipestart', this.onSwipeStartListener);
        window.addEventListener('swipe', this.onSwipeListener);
        window.addEventListener('swipeend', this.onSwipeEndListener);
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
                {this.props.children}
            </AnimationLayerDataContext.Provider>
        );
    }
}