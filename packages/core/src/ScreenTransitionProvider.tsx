import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { AnimationEffectFactory, CustomElementType } from './common/types';
import { NavigationBase } from './NavigationBase';
import { Component, ElementType, createRef } from 'react';

interface ScreenTransitionProviderProps {
    id: string;
    animation?: AnimationEffectFactory;
    children: React.ReactNode
    navigation: NavigationBase;
    renderAs: ElementType | CustomElementType;
}

interface ScreenTransitionProviderState {
    zIndex: number;
}

export class ScreenTransitionProvider extends Component<ScreenTransitionProviderProps, ScreenTransitionProviderState> {
    public readonly ref = createRef<HTMLDivElement>();
    static readonly contextType = ScreenTransitionLayerContext;
    context!: React.ContextType<typeof ScreenTransitionLayerContext>;
    public index = 0;
    public exiting = false;

    state: ScreenTransitionProviderState = {
        zIndex: 0,
    }

    private onAnimationEnd = () => {
        if (this.ref.current) {
            this.ref.current.style.willChange = 'auto';
            this.ref.current.style.pointerEvents = 'auto';
        }
    }

    private onAnimationStart = () => {
        if (this.ref.current) {
            this.ref.current.style.willChange = 'transform, opacity';
            this.ref.current.style.pointerEvents = 'none';
        }
    }

    componentDidMount() {
        this.props.navigation.addEventListener('transition-start', this.onAnimationStart);
        this.props.navigation.addEventListener('transition-end', this.onAnimationEnd);
    }

    componentWillUnmount() {
        this.props.navigation.removeEventListener('transition-start', this.onAnimationStart);
        this.props.navigation.removeEventListener('transition-end', this.onAnimationEnd);
    }

    get animationEffect() {
        const animationEffectFactory = this.props.animation;
        const { animation, direction } = this.context!;
        const { timeline, playbackRate } = animation;
        const { index, exiting, ref } = this;

        return animationEffectFactory?.({
            ref: ref.current,
            index,
            exiting,
            timeline,
            direction,
            playbackRate
        }) ?? null;
    }

    setZIndex(zIndex: number) {
        return new Promise<void>(resolve => this.setState({ zIndex }, resolve));
    }

    render() {
        const Element = this.props.renderAs;
        const inert = this.state.zIndex === 0 ? '' : undefined;
        return (
            <Element
                id={this.props.id}
                className="screen-animation-provider"
                ref={this.ref}
                {...{ inert }}
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