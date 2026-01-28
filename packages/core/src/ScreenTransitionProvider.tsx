import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { AnimationEffectFactory } from './common/types';
import { NavigationBase } from './NavigationBase';
import { Component, ElementType, createRef } from 'react';
import { FIRST_INDEX } from './common/constants';

interface ScreenTransitionProviderProps {
    id: string;
    animation?: AnimationEffectFactory;
    children: React.ReactNode
    navigation: NavigationBase;
    renderAs: ElementType;
    focused: boolean;
}

interface ScreenTransitionProviderState {
    zIndex: React.CSSProperties['zIndex'];
}

export class ScreenTransitionProvider extends Component<
  ScreenTransitionProviderProps,
  ScreenTransitionProviderState
> {
  public readonly ref = createRef<HTMLElement>();
  public static readonly contextType = ScreenTransitionLayerContext;
  public declare context: React.ContextType<
    typeof ScreenTransitionLayerContext
  >;
  public index = FIRST_INDEX;
  public exiting = false;

  public state: ScreenTransitionProviderState = {
    zIndex: 'unset',
  };

  private onAnimationEnd = () => {
    if (this.ref.current) {
      this.ref.current.style.willChange = 'auto';
      this.ref.current.style.pointerEvents = 'auto';
    }
  };

  private onAnimationStart = () => {
    if (this.ref.current) {
      this.ref.current.style.willChange = 'transform, opacity';
      this.ref.current.style.pointerEvents = 'none';
    }
  };

  public componentDidMount() {
    this.props
      .navigation
      .addEventListener('transition-start', this.onAnimationStart);
    this.props
      .navigation
      .addEventListener('transition-end', this.onAnimationEnd);
    this.props
      .navigation
      .addEventListener('transition-cancel', this.onAnimationEnd);
  }

  public componentWillUnmount() {
    this.props
      .navigation
      .removeEventListener('transition-start', this.onAnimationStart);
    this.props
      .navigation
      .removeEventListener('transition-end', this.onAnimationEnd);
    this.props
      .navigation
      .removeEventListener('transition-cancel', this.onAnimationEnd);
  }

  public get animationEffect() {
    const animationEffectFactory = this.props.animation;
    const { animation, direction, hasUAVisualTransition } = this.context;
    const { timeline, playbackRate } = animation;
    const { index, exiting, ref } = this;
    const screens = this.context.screens.map(screen => screen.current?.name);

    return animationEffectFactory?.({
      ref: ref.current,
      index,
      screens,
      exiting,
      timeline,
      direction,
      playbackRate,
      hasUAVisualTransition,
    }) ?? null;
  }

  public setZIndex(zIndex: React.CSSProperties['zIndex']) {
    return new Promise<void>(resolve => this.setState({ zIndex }, resolve));
  }

  public render() {
    const Element = this.props.renderAs;
    const inert = !this.props.focused ? '' : undefined;
    return (
      <Element
        id={this.props.id}
        className="screen-transition-provider"
        ref={this.ref}
        {...{ inert }}
        style={{
          gridArea: '1 / 1',
          width: '100%',
          height: '100%',
          transformOrigin: 'center center',
          zIndex: this.state.zIndex,
        }}
      >
        {this.props.children}
      </Element>
    );
  }
}