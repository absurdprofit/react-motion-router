import { AnimationFactory, CustomElementType } from './common/types';
import { AnimationLayerData, AnimationLayerDataContext } from './AnimationLayerData';
import { NavigationBase } from './NavigationBase';
import { Component, ElementType } from 'react';
import { DEFAULT_ANIMATION } from './common/constants';

interface AnimationProviderProps {
    onRef: (ref: HTMLElement | null) => void;
    onExit: Function;
    onExited: Function;
    onEnter: Function;
    onEntered: Function;
    in: boolean;
    out: boolean;
    id: string;
    animation?: {
        in?: AnimationFactory;
        out?: AnimationFactory;
    };
    pseudoElementAnimation?: {
        in?: AnimationFactory;
        out?: AnimationFactory;
    };
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
    private ref: HTMLElement | null = null;
    static readonly contextType = AnimationLayerDataContext;
    context!: React.ContextType<typeof AnimationLayerDataContext>;

    constructor(props: AnimationProviderProps, context: React.ContextType<typeof AnimationLayerDataContext>) {
        super(props);

        requestAnimationFrame(() => {
            if (this.state.mounted) {
                this.props.onEnter();
            }
        });
    }

    state: AnimationProviderState = {
        mounted: this.props.in,
        zIndex: this.props.in ? 1 : 0
    }

    onRef = (ref: HTMLElement | null) => {
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
        if (this.context) {
            if (this.props.in) {
                this.context.nextScreen = this;
            } else if (this.props.out) {
                this.context.currentScreen = this;
            }
        }
    }

    componentDidUpdate(prevProps: AnimationProviderProps) {
        if (!this.context) return;
        if (this.props.out !== prevProps.out || this.props.in !== prevProps.in) {
            if (this.props.out) {
                // set current screen and call onExit
                this.context.currentScreen = this;
            } else if (this.props.in) {
                // this.context.onEnter = this.props.onEnter;
                this.context.nextScreen = this;
            }
            this.ref?.toggleAttribute('inert', this.state.zIndex === 0);
        }
    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('page-animation-start', this.onAnimationStart);
        this.props.navigation.removeEventListener('page-animation-end', this.onAnimationEnd);
    }

    private getAnimation(animationFactory?: AnimationFactory) {
        const { timeline, direction, playbackRate } = this.context!;

        return animationFactory?.({
            ref: this.ref,
            timeline,
            direction,
            playbackRate
        }) ?? null;
    }

    get zIndex() {
        return this.props.in ? 1 : 0;
    }

    get pseudoElementInAnimation() {
        return this.getAnimation(this.props.pseudoElementAnimation?.in);
    }

    get pseudoElementOutAnimation() {
        return this.getAnimation(this.props.pseudoElementAnimation?.out);
    }

    get inAnimation() {
        return this.getAnimation(this.props.animation?.in);
    }

    get outAnimation() {
        return this.getAnimation(this.props.animation?.out);
    }

    mounted(_mounted: boolean, willAnimate: boolean = true): Promise<void> {
        return new Promise((resolve) => {
            const onMountChange = () => {
                if (_mounted) {
                    if (willAnimate) {
                        if (this.ref) this.ref.style.willChange = 'transform, opacity';
                    }
                    const shouldScroll = Boolean(
                        (this.props.in && !this.context?.gestureNavigating)
                        || (this.props.out && this.context?.gestureNavigating)
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
                this.setState({ mounted: _mounted }, onMountChange);
            }
        });
    }

    render() {
        const Element = this.props.renderAs;
        if (!this.state.mounted) return <></>;
        return (
            <Element
                id={this.props.id}
                className="animation-provider"
                ref={this.onRef}
                tabIndex={this.state.zIndex - 1}
                style={{
                    gridArea: '1 / 1',
                    width: '100%',
                    height: '100%',
                    transformOrigin: 'center center',
                    zIndex: this.state.zIndex
                }}
            >
                {this.props.children}
            </Element>
        );
    }
}