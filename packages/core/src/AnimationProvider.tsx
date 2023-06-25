import React from 'react';
import { AnimationConfigSet, AnimationDirection, AnimationKeyframeEffectConfig, EasingFunction } from './common/types';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import AnimationKeyframePresets from './Animations';
import NavigationBase from './NavigationBase';

interface AnimationProviderProps {
    onExit: Function;
    onEnter: Function;
    in: boolean;
    out: boolean;
    name: string;
    resolvedPathname?: string;
    animation: AnimationConfigSet | (() => AnimationConfigSet);
    backNavigating: boolean;
    keepAlive: boolean;
    children: React.ReactNode
    navigation: NavigationBase;
}

interface AnimationProviderState {
    mounted: boolean;
    zIndex: number;
}

const OppositeDirection = {
    "left": "right" as const,
    "right": "left" as const,
    "up": "down" as const,
    "down": "up" as const,
    "in": "out" as const,
    "out": "in" as const
}

export default class AnimationProvider extends React.Component<AnimationProviderProps, AnimationProviderState> {
    private _animationLayerData: AnimationLayerData | null = null;
    private ref: HTMLElement | null = null;
    private onAnimationEnd = this.animationEnd.bind(this);
    private onNavigate = this.navigate.bind(this);
    private setRef = this.onRef.bind(this);

    state: AnimationProviderState = {
        mounted: false,
        zIndex: 0
    }
    
    onRef(ref: HTMLElement | null) {
        this.ref = ref;
    }

    animationEnd() {
        if (this.ref) {
            this.ref.style.willChange = 'auto';
            this.ref.style.pointerEvents = 'auto';
        }
    }

    navigate() {
        if (this.ref) {
            this.ref.style.willChange = 'transform, opacity';
            this.ref.style.pointerEvents = 'none';
        }
    }

    componentDidMount() {
        this.props.navigation.addEventListener('page-animation-start', this.onNavigate);
        this.props.navigation.addEventListener('motion-progress-start', this.onNavigate);
        this.props.navigation.addEventListener('page-animation-end', this.onAnimationEnd);
        this.props.navigation.addEventListener('motion-progress-end', this.onAnimationEnd);
        if (this._animationLayerData) {
            if (this.props.in) {
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
                // this._animationLayerData.onEnter = this.props.onEnter;
                this._animationLayerData.nextScreen = this;
            }
        }
    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('page-animation-start', this.onNavigate);
        this.props.navigation.removeEventListener('motion-progress-start', this.onNavigate);
        this.props.navigation.removeEventListener('page-animation-end', this.onAnimationEnd);
        this.props.navigation.removeEventListener('motion-progress-end', this.onAnimationEnd);
    }

    get inAnimation(): AnimationKeyframeEffectConfig | [keyof typeof AnimationKeyframePresets, number, EasingFunction | undefined] {
        let animation;
        if (typeof this.props.animation === "function") {
            animation = this.props.animation();
        } else {
            animation = this.props.animation;
        }

        if ('type' in animation.in) {
            let direction: AnimationDirection | undefined = animation.in.direction;
            let directionPrefix: '' | 'back-' = '' as const;
            const backNavigating = this.props.backNavigating;
            if (backNavigating && direction) {
                if (animation.in.type === "zoom" || animation.in.type === "slide") {
                    direction = OppositeDirection[direction];
                    directionPrefix = 'back-' as const;
                }
            }
            switch(animation.in.type) {
                case "slide":
                    if (direction === 'in' || direction === 'out') direction = 'left';
                    return [`slide-${directionPrefix}${direction || 'left'}-in`, animation.in.duration, animation.in.easingFunction];
    
                case "zoom":
                    if (direction !== 'in' && direction !== 'out') direction = 'in';
                    return [`zoom-${direction || 'in'}-in`, animation.in.duration, animation.in.easingFunction];
                
                case "fade":
                    return ["fade-in", animation.in.duration, animation.in.easingFunction];
                
                default:
                    return ["none", animation.in.duration, undefined];
            }
        } else {
            return animation.in;
        }
    }

    get outAnimation(): AnimationKeyframeEffectConfig | [keyof typeof AnimationKeyframePresets, number, EasingFunction | undefined] {
        let animation;
        if (typeof this.props.animation === "function")  {
            animation = this.props.animation();
        } else {
            animation = this.props.animation;
        }

        if ('type' in animation.out) {
            let direction: AnimationDirection | undefined = animation.out.direction;
            let directionPrefix: '' | 'back-' = '' as const;
            const backNavigating = this.props.backNavigating;
            if (backNavigating && direction) {
                if (animation.out.type === "zoom" || animation.out.type === "slide") {
                    direction = OppositeDirection[direction];
                    directionPrefix = 'back-' as const;
                }
            }
            switch(animation.out.type) {
                case "slide":
                    if (direction === "in" || direction === "out") direction = 'left';
                    return [`slide-${directionPrefix}${direction || 'left'}-out`, animation.out.duration, animation.out.easingFunction];

                case "zoom":
                    if (direction !== "in" && direction !== "out") direction = 'in';
                    return [`zoom-${direction || 'in'}-out`, animation.out.duration, animation.out.easingFunction];
                
                case "fade":
                    return ["fade-out", animation.out.duration, animation.out.easingFunction];
                
                default:
                    return ["none", animation.out.duration, undefined];
            }
        } else {
            return animation.out;
        }
    }

    get duration() {
        const animation = this.props.in ? this.inAnimation : this.outAnimation;
        if (Array.isArray(animation)) {
            const [_, duration] = animation;
            return duration;
        } else {
            if (typeof animation.options === "number") return animation.options;
            return animation.options?.duration;
        }
    }

    get animation() {
        if (!this.ref) return null;
        let easingFunction = this._animationLayerData?.gestureNavigating ? 'linear' : 'ease-out';
        if (this.props.in) {
            if (Array.isArray(this.inAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this.inAnimation;
                return new Animation(
                    new KeyframeEffect(this.ref, AnimationKeyframePresets[animation], {
                        fill: 'both',
                        duration: duration,
                        easing: userDefinedEasingFunction || easingFunction
                    })
                );
            } else { // user provided animation
                let {keyframes, options} = this.inAnimation;
                if (typeof options === "number") {
                    options = {
                        duration: options,
                        easing: easingFunction,
                        fill: 'both'
                    };
                } else {
                    options = {
                        ...options,
                        fill: options?.fill || 'both',
                        duration: options?.duration || this._animationLayerData?.duration,
                        easing: options?.easing || easingFunction
                    };
                }
                return new Animation(
                    new KeyframeEffect(this.ref, keyframes, options)
                );
            }
        } else {
            if (Array.isArray(this.outAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this.outAnimation;
                return new Animation(
                    new KeyframeEffect(this.ref, AnimationKeyframePresets[animation], {
                        fill: 'both',
                        duration: duration,
                        easing: userDefinedEasingFunction || easingFunction
                    })
                );
            } else { // user provided animation
                let {keyframes, options} = this.outAnimation;
                if (typeof options === "number") {
                    options = {
                        duration: options,
                        easing: easingFunction,
                        fill: 'both'
                    };
                } else {
                    options = {
                        ...options,
                        easing: options?.easing || easingFunction,
                        duration: options?.duration || this._animationLayerData?.duration,
                        fill: options?.fill || 'both'
                    };
                }
                return new Animation(
                    new KeyframeEffect(this.ref, keyframes, options)
                );
            }
        }
    }

    animate(keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions | undefined): Animation | null {
        if (typeof options === "number")
            options = {duration: options};
        options = {
            ...options,
            id: `${this.props.name}-${this.props.in ? 'in' : 'out'}`
        }
        return this.ref?.animate(keyframes, options) || null;
    }

    set zIndex(_zIndex: number) {
        this.setState({zIndex: _zIndex});
    }

    mounted(_mounted: boolean, willAnimate: boolean = true): Promise<void> {
        return new Promise((resolve) => {
            const onMountChange = () => {
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
            };
            if (this.props.keepAlive && !_mounted) { // keep screen in the DOM
                resolve();
            } else {
                this.setState({mounted: _mounted}, onMountChange);
            }
        });
    }

    render() {
        return (
            <div id={this.props.name} className="animation-provider" ref={this.setRef} style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                contain: 'strict',
                transformOrigin: 'center center',
                zIndex: this.state.zIndex
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