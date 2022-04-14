import React from 'react';
import { AnimationConfig } from './common/types';
import AnimationLayerData, {AnimationLayerDataContext} from './AnimationLayerData';
import AnimationKeyframePresets from './Animations';

interface AnimationProviderProps {
    onExit: Function;
    onEnter: Function;
    in: boolean;
    out: boolean;
    name: string;
    animation: {
        in: AnimationConfig;
        out: AnimationConfig;
    } | (() => {in: AnimationConfig, out: AnimationConfig});
    backNavigating: boolean;
    children: React.ReactNode;
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

export default class AnimationProvider extends React.Component<AnimationProviderProps, AnimationProviderState> {
    private _animationLayerData: AnimationLayerData | null = null;
    private ref: HTMLElement | null = null;
    private onAnimationEnd = this.animationEnd.bind(this);
    private onNavigate = this.navigate.bind(this);
    private setRef = this.onRef.bind(this);

    state: AnimationProviderState = {
        mounted: false,
    }
    
    onRef(ref: HTMLElement | null) {
        this.ref = ref;
    }

    animationEnd() {
        if (this.ref) this.ref.style.willChange = 'auto';
    }

    navigate() {
        if (this.ref) this.ref.style.willChange = 'transform, opacity';
    }

    componentDidMount() {
        window.addEventListener('go-back', this.onNavigate);
        window.addEventListener('navigate', this.onNavigate);
        window.addEventListener('page-animation-end', this.onAnimationEnd);
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
        window.removeEventListener('go-back', this.onNavigate);
        window.removeEventListener('navigate', this.onNavigate);
        window.removeEventListener('page-animation-end', this.onAnimationEnd);
    }

    get inAnimation() {
        let animation;
        if (typeof this.props.animation === "function") {
            animation = this.props.animation();
        } else {
            animation = this.props.animation;
        }

        let direction = animation.in.direction;
        let directionPrefix = '';
        const backNavigating = this.props.backNavigating;
        if (backNavigating && direction) {
            if (animation.in.type === "zoom" || animation.in.type === "slide") {
                direction = OppositeDirection[direction];
                directionPrefix = 'back-';
            }
        }
        switch(animation.in.type) {
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
        let animation;
        if (typeof this.props.animation === "function")  {
            animation = this.props.animation();
        } else {
            animation = this.props.animation;
        }

        let direction = animation.out.direction;
        let directionPrefix = '';
        const backNavigating = this.props.backNavigating;
        if (backNavigating && direction) {
            if (animation.out.type === "zoom" || animation.out.type === "slide") {
                direction = OppositeDirection[direction];
                directionPrefix = 'back-'
            }
        }
        switch(animation.out.type) {
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

    mounted(_mounted: boolean, willAnimate: boolean = true): Promise<void> {
        return new Promise((resolve, _) => {
            this.setState({mounted: _mounted}, () => {
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
            });
        });
    }

    render() {
        return (
            <div className="animation-provider" ref={this.setRef} style={{
                position: 'absolute',
                transformOrigin: 'center center',
                zIndex: this.props.in && !this.props.backNavigating ? 1 : this.props.out && this.props.backNavigating ? 1 : 0,
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