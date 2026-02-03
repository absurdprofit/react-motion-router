import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { AnimationEffectFactory, EventHandler } from './common/types';
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
> implements EventHandler {
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

  public handleEvent(e: Event) {
    const key = `on${e.type}` as keyof this;

    const self = this as {
      [K in typeof key]?: (e: Event) => void;
    };

    self[key]?.(e);
  }

  public onroutertransitionend() {
    if (this.ref.current) {
      this.ref.current.style.willChange = 'auto';
      this.ref.current.style.pointerEvents = 'auto';
    }
  };

  public onroutertransitionstart() {
    if (this.ref.current) {
      this.ref.current.style.willChange = 'transform, opacity';
      this.ref.current.style.pointerEvents = 'none';
    }
  };

  public componentDidMount() {
    this.props
      .navigation
      .addEventListener('routertransitionstart', this);
    this.props
      .navigation
      .addEventListener('routertransitionend', this);
    this.props
      .navigation
      .addEventListener('routertransitioncancel', this);
  }

  public componentWillUnmount() {
    this.props
      .navigation
      .removeEventListener('routertransitionstart', this);
    this.props
      .navigation
      .removeEventListener('routertransitionend', this);
    this.props
      .navigation
      .removeEventListener('routertransitioncancel', this);
  }

  public get animationEffect() {
    const animationEffectFactory = this.props.animation;
    const { animation, direction, hasUAVisualTransition } = this.context;
    const { timeline, playbackRate } = animation;
    const { index, exiting, ref } = this;
    const screens = this.context.screens.map(screen => screen.current?.name);

    return animationEffectFactory?.({
      ref: ref.current,
      id: this.props.id,
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
          viewTransitionName: this.props.id,
        }}
      >
        {this.props.children}
      </Element>
    );
  }
}