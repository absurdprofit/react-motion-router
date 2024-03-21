import { AnimationConfigSet, AnimationDirection, AnimationKeyframeEffectConfig, CustomElementType, EasingFunction } from './common/types';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import AnimationKeyframePresets from './Animations';
import NavigationBase from './NavigationBase';
import { Component, ElementType } from 'react';

interface AnimationProviderProps {
    onRef: (ref: HTMLElement | null) => void;
    onExit: Function;
    onExited: Function;
    onEnter: Function;
    onEntered: Function;
    in: boolean;
    out: boolean;
    name: string;
    resolvedPathname?: string;
    animation: AnimationConfigSet | (() => AnimationConfigSet);
    pseudoElement?: {
        selector: string;
        animation: AnimationConfigSet | (() => AnimationConfigSet);
    }
    backNavigating: boolean;
    keepAlive: boolean;
    children: React.ReactNode
    navigation: NavigationBase;
    renderAs: ElementType | CustomElementType;
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

export default class AnimationProvider extends Component<AnimationProviderProps, AnimationProviderState> {
    private _animationLayerData: AnimationLayerData | null = null;
    private ref: HTMLElement | null = null;
    private onAnimationEnd = this.animationEnd.bind(this);
    private onNavigate = this.navigate.bind(this);
    private setRef = this.onRef.bind(this);

    constructor(props: AnimationProviderProps) {
        super(props);

        requestAnimationFrame(() => {
            if (this.state.mounted) {
                this.props.onEnter();
            }
        });
    }

    state: AnimationProviderState = {
        mounted: this.props.out && this.props.keepAlive,
        zIndex: this.props.in ? 1 : 0
    }
    
    onRef(ref: HTMLElement | null) {
        this.ref = ref;
        this.props.onRef(ref);
    }

    animationEnd() {
        if (this.ref) {
            this.ref.style.willChange = 'auto';
            this.ref.style.pointerEvents = 'auto';
        }
        if (this.props.in) {
            this.props.onEntered();
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
        if (this.state.mounted) {
            this.props.onEntered();
        }
        if (this._animationLayerData) {
            if (this.props.in) {
                this._animationLayerData.nextScreen = this;
            }
            if (this.props.out && !this.state.mounted) {
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

    private getAnimationConfig(
        type: "in" | "out",
        animation: AnimationConfigSet | (() => AnimationConfigSet)
    ): AnimationKeyframeEffectConfig | [keyof typeof AnimationKeyframePresets, number, EasingFunction | undefined] {
        if (typeof animation === "function") {
            animation = animation();
        } else {
            animation = animation;
        }

        const animationConfig = animation[type];
        if ('type' in animationConfig) {
            let direction: AnimationDirection | undefined = animationConfig.direction;
            let directionPrefix: '' | 'back-' = '' as const;
            const backNavigating = this.props.backNavigating;
            if (backNavigating && direction) {
                if (animationConfig.type === "zoom" || animationConfig.type === "slide") {
                    direction = OppositeDirection[direction];
                    directionPrefix = 'back-' as const;
                }
            }
            switch(animationConfig.type) {
                case "slide":
                    if (direction === 'in' || direction === 'out') direction = 'left';
                    return [`slide-${directionPrefix}${direction || 'left'}-${type}`, animationConfig.duration, animationConfig.easingFunction];
    
                case "zoom":
                    if (direction !== 'in' && direction !== 'out') direction = 'in';
                    return [`zoom-${direction || 'in'}-${type}`, animationConfig.duration, animationConfig.easingFunction];
                
                case "fade":
                    return [`fade-${type}`, animationConfig.duration, animationConfig.easingFunction];
                
                default:
                    return ["none", animationConfig.duration, undefined];
            }
        } else {
            return animationConfig;
        }
    }

    get zIndex() {
        return this.props.in ? 1 : 0;
    }

    get pseudoElementInAnimation() {
        if (this.props.pseudoElement)
            return this.getAnimationConfig("in", this.props.pseudoElement.animation);
        return null;
    }

    get pseudoElementOutAnimation() {
        if (this.props.pseudoElement)
            return this.getAnimationConfig("out", this.props.pseudoElement.animation);
        return null;
    }

    get inAnimation() {
        return this.getAnimationConfig("in", this.props.animation);
    }

    get outAnimation(): AnimationKeyframeEffectConfig | [keyof typeof AnimationKeyframePresets, number, EasingFunction | undefined] {
        return this.getAnimationConfig("out", this.props.animation);
    }

    get pseudoElementDuration() {
        const animation = this.props.in ? this.pseudoElementInAnimation : this.pseudoElementOutAnimation;
        if (!animation) return null;
        if (Array.isArray(animation)) {
            const [_, duration] = animation;
            return duration;
        } else {
            if (typeof animation.options === "number") return animation.options;
            return animation.options?.duration;
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

    get pseudoElementAnimation() {
        if (!this.ref || !this.props.pseudoElement) return null;
        const pseudoElement = this.props.pseudoElement.selector;
        let easingFunction = this._animationLayerData?.gestureNavigating ? 'linear' : 'ease-out';
        if (this.props.in) {
            if (Array.isArray(this.pseudoElementInAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this.pseudoElementInAnimation;
                return new Animation(
                    new KeyframeEffect(this.ref, AnimationKeyframePresets[animation], {
                        fill: 'both',
                        duration: duration,
                        easing: userDefinedEasingFunction || easingFunction,
                        pseudoElement
                    })
                );
            } else { // user provided animation
                let {keyframes, options} = this.pseudoElementInAnimation!;
                if (typeof options === "number") {
                    options = {
                        duration: options,
                        easing: easingFunction,
                        fill: 'both',
                        pseudoElement
                    };
                } else {
                    options = {
                        ...options,
                        fill: options?.fill || 'both',
                        duration: options?.duration || this._animationLayerData?.duration,
                        easing: options?.easing || easingFunction,
                        pseudoElement
                    };
                }
                return new Animation(
                    new KeyframeEffect(this.ref, keyframes, options)
                );
            }
        } else {
            if (Array.isArray(this.pseudoElementOutAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this.pseudoElementOutAnimation;
                return new Animation(
                    new KeyframeEffect(this.ref, AnimationKeyframePresets[animation], {
                        fill: 'both',
                        duration: duration,
                        easing: userDefinedEasingFunction || easingFunction,
                        pseudoElement
                    })
                );
            } else { // user provided animation
                let {keyframes, options} = this.pseudoElementOutAnimation!;
                if (typeof options === "number") {
                    options = {
                        duration: options,
                        easing: easingFunction,
                        fill: 'both',
                        pseudoElement
                    };
                } else {
                    options = {
                        ...options,
                        easing: options?.easing || easingFunction,
                        duration: options?.duration || this._animationLayerData?.duration,
                        fill: options?.fill || 'both',
                        pseudoElement
                    };
                }
                return new Animation(
                    new KeyframeEffect(this.ref, keyframes, options)
                );
            }
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
                } else {
                    this.props.onExited();
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
        const Element = this.props.renderAs;
        return (
            <Element
                id={`${this.props.name}-animation-provider`}
                className="animation-provider"
                ref={this.setRef}
                tabIndex={this.state.zIndex - 1}
                inert={this.state.zIndex === 0}
                style={{
                    gridArea: '1 / 1',
                    width: '100%',
                    height: '100%',
                    transformOrigin: 'center center',
                    zIndex: this.state.zIndex
                }}
            >
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
            </Element>
        ); 
    }
}