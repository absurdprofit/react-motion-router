import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { AnimationEffectFactory } from './common/types';
import { RefObject, useContext, useImperativeHandle } from 'react';
import { FIRST_INDEX } from './common/constants';

export interface ScreenTransitionProvider {
  index: number;
  exiting: boolean;
  readonly animationEffect: AnimationEffect | null;
  readonly screenElementRef: RefObject<HTMLElement | null>;
}

export interface ScreenTransitionProviderProps {
  viewTransitionName: string;
  animation?: AnimationEffectFactory;
  children: React.ReactNode
  screenElementRef: RefObject<HTMLElement | null>;
  ref?: RefObject<ScreenTransitionProvider | null>;
}

export function ScreenTransitionProvider(props: ScreenTransitionProviderProps) {
  const context = useContext(ScreenTransitionLayerContext);

  useImperativeHandle(
    props.ref,
    () => ({
      index: FIRST_INDEX,
      exiting: false,
      get screenElementRef() {
        return props.screenElementRef;
      },
      get animationEffect() {
        const animationEffectFactory = props.animation;
        const { animation, direction, hasUAVisualTransition } = context;
        const { timeline, playbackRate } = animation;
        const { index, exiting, screenElementRef } = this;
        const { viewTransitionName } = props;
        const screens = context.screens.map(screen => screen.current?.name);

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
      },
    })
  );

  return props.children;
}