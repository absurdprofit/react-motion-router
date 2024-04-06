import { AnimationFactory, CustomElementType } from './common/types';
import { AnimationLayerDataContext } from './AnimationLayerData';
import { NavigationBase } from './NavigationBase';
import { Component, ElementType } from 'react';

interface AnimationProviderProps {
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
    zIndex: number;
}

export class AnimationProvider extends Component<AnimationProviderProps, AnimationProviderState> {
    private _ref: HTMLElement | null = null;
    static readonly contextType = AnimationLayerDataContext;
    context!: React.ContextType<typeof AnimationLayerDataContext>;

    state: AnimationProviderState = {
        zIndex: 0
    }

    onRef = (ref: HTMLElement | null) => {
        this._ref = ref;
    }

    private onAnimationEnd = () => {
        if (this.ref) {
            this.ref.style.willChange = 'auto';
            this.ref.style.pointerEvents = 'auto';
        }
    }

    private onAnimationStart = () => {
        if (this.ref) {
            this.ref.style.willChange = 'transform, opacity';
            this.ref.style.pointerEvents = 'none';
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

    private getAnimation(animationFactory?: AnimationFactory) {
        const { timeline, direction, playbackRate } = this.context!;

        return animationFactory?.({
            ref: this.ref,
            timeline,
            direction,
            playbackRate
        }) ?? null;
    }

    get ref() {
        return this._ref;
    }

    setZIndex(zIndex: number) {
        return new Promise<void>(resolve => this.setState({ zIndex }, resolve));
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

    render() {
        const Element = this.props.renderAs;
        const inert = this.state.zIndex === 0 ? '' : undefined;
        return (
            <Element
                id={this.props.id}
                className="animation-provider"
                ref={this.onRef}
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