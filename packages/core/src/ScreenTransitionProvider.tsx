import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { AnimationEffectFactory } from './common/types';
import { Component, RefObject } from 'react';
import { FIRST_INDEX } from './common/constants';

interface ScreenTransitionProviderProps {
  viewTransitionName: string;
  animation?: AnimationEffectFactory;
  children: React.ReactNode
  screenElementRef: RefObject<HTMLElement | null>;
}

export class ScreenTransitionProvider extends Component<
  ScreenTransitionProviderProps
> {
  public static readonly contextType = ScreenTransitionLayerContext;
  public declare context: React.ContextType<
    typeof ScreenTransitionLayerContext
  >;
  public index = FIRST_INDEX;
  public exiting = false;

  public get screenElementRef() {
    return this.props.screenElementRef;
  }

  public get animationEffect() {
    const animationEffectFactory = this.props.animation;
    const { animation, direction, hasUAVisualTransition } = this.context;
    const { timeline, playbackRate } = animation;
    const { index, exiting, screenElementRef } = this;
    const { viewTransitionName } = this.props;
    const screens = this.context.screens.map(screen => screen.current?.name);

    return animationEffectFactory?.({
      ref: screenElementRef.current,
      index,
      screens,
      exiting,
      timeline,
      direction,
      playbackRate,
      viewTransitionName,
      hasUAVisualTransition,
    }) ?? null;
  }

  public render() {
    return this.props.children;
  }
}