import { AnimationConfig, CustomElementType } from './common/types';
import { AnimationLayerData, AnimationLayerDataContext } from './AnimationLayerData';
import { NavigationBase } from './NavigationBase';
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
    animationFactory: () => AnimationConfig;
    pseudoElementAnimationFactory: () => AnimationConfig;
    keepAlive: boolean;
    children: React.ReactNode
    navigation: NavigationBase;
    renderAs: ElementType | CustomElementType;
}

interface AnimationProviderState {
    mounted: boolean;
    zIndex: number;
}

export class AnimationProvider extends Component<AnimationProviderProps, AnimationProviderState> {
    private _animationLayerData: AnimationLayerData | null = null;
    private ref: HTMLElement | null = null;
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

    private onAnimationEnd = () => {
        if (this.ref) {
            this.ref.style.willChange = 'auto';
            this.ref.style.pointerEvents = 'auto';
        }
        if (this.props.in) {
            this.props.onEntered();
        }
    }

    private onAnimationStart = () => {
        if (this.ref) {
            this.ref.style.willChange = 'transform, opacity';
            this.ref.style.pointerEvents = 'none';
        }
        if (this.props.out) {
            this.props.onExit();
        }
    }

    componentDidMount() {
        this.props.navigation.addEventListener('page-animation-start', this.onAnimationStart);
        this.props.navigation.addEventListener('page-animation-end', this.onAnimationEnd);
        if (this.state.mounted) {
            this.props.onEntered();
        }
        if (this._animationLayerData) {
            if (this.props.in) {
                this._animationLayerData.nextScreen = this;
            }
            if (this.props.out && !this.state.mounted) {
                this._animationLayerData.currentScreen = this;
            }
        }
    }

    componentDidUpdate(prevProps: AnimationProviderProps) {
        if (!this._animationLayerData) return;
        if (this.props.out !== prevProps.out || this.props.in !== prevProps.in) {
            if (this.props.out) {
                // set current screen and call onExit
                this._animationLayerData.currentScreen = this;
            } else if (this.props.in) {
                // this._animationLayerData.onEnter = this.props.onEnter;
                this._animationLayerData.nextScreen = this;
            }
            this.ref?.toggleAttribute('inert', this.state.zIndex === 0);
        }
    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('page-animation-start', this.onAnimationStart);
        this.props.navigation.removeEventListener('page-animation-end', this.onAnimationEnd);
    }

    private getAnimationConfig(
        type: "in" | "out",
        animation: AnimationConfig
    ) {
        return animation[type] ?? null;
    }

    get zIndex() {
        return this.props.in ? 1 : 0;
    }

    get pseudoElementInAnimation() {
        return this.getAnimationConfig("in", this.props.pseudoElementAnimationFactory());
    }

    get pseudoElementOutAnimation() {
        return this.getAnimationConfig("out", this.props.pseudoElementAnimationFactory());
    }

    get inAnimation() {
        return this.getAnimationConfig("in", this.props.animationFactory());
    }

    get outAnimation() {
        return this.getAnimationConfig("out", this.props.animationFactory());
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