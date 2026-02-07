import { Component, RefObject, createRef } from 'react';
import { SharedElementTransitionLayer } from './SharedElementTransitionLayer';
import { ParallelEffect, Animation } from 'web-animations-extension';
import { ScreenTransitionLayerContext } from './ScreenTransitionLayerContext';
import { ScreenChild } from './common/types';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';

interface ScreenTransitionLayerProps {
  children: ScreenChild | ScreenChild[];
  navigation: NavigationBase;
  hasUAVisualTransition: boolean;
}

interface ScreenTransitionLayerState {
  gestureNavigating: boolean;
}

export class ScreenTransitionLayer extends Component<
  ScreenTransitionLayerProps,
  ScreenTransitionLayerState
> {
  public readonly sharedElementTransitionLayer =
    createRef<SharedElementTransitionLayer>();
  public readonly animation: Animation = new Animation();
  #direction: PlaybackDirection = 'normal';
  #screens: RefObject<ScreenBase>[] = [];

  public state: ScreenTransitionLayerState = {
    gestureNavigating: false,
  };

  private onTransitionCancel() {
    this.props.navigation.dispatchEvent(
      new TransitionEvent('routertransitioncancel')
    );
  }

  private onTransitionStart() {
    this.props
      .navigation
      .dispatchEvent(new TransitionEvent('routertransitionstart'));
  }

  private onTransitionEnd() {
    this.props
      .navigation
      .dispatchEvent(new TransitionEvent('routertransitionend'));
  }

  public get screens() {
    return this.#screens;
  }

  public set screens(screens: RefObject<ScreenBase>[]) {
    this.#screens = screens;
  }

  public set direction(direction: PlaybackDirection) {
    this.#direction = direction;
    this.animation.effect?.updateTiming({ direction });
  }

  public get direction() {
    return this.#direction;
  }

  public get hasUAVisualTransition() {
    return this.props.hasUAVisualTransition;
  }

  public transition() {
    const effect = new ParallelEffect(
      this.screens.map(screen => {
        return screen.current
          ?.transitionProvider
          ?.current
          ?.animationEffect ?? null;
      }).filter((effect): effect is AnimationEffect => effect !== null)
    );

    const sharedElementEffect = this.sharedElementTransitionLayer
      .current
      ?.animationEffect;
    const duration = effect.getComputedTiming().duration;
    if (sharedElementEffect) {
      sharedElementEffect.updateTiming({
        duration: duration instanceof CSSNumericValue
          ? duration.to('ms').value
          : duration,
      });
      effect.append(sharedElementEffect);
      this.sharedElementTransitionLayer.current?.ref.current?.showModal();
    }

    this.animation.effect = effect;

    this.animation.play();
    this.onTransitionStart();

    this.animation.oncancel = () => {
      this.sharedElementTransitionLayer.current?.ref.current?.close();
      this.onTransitionCancel();
      this.animation.effect = null;
    };
    this
      .animation
      .finished
      .then(() => {
        this.animation.commitStyles();
        this.onTransitionEnd();
        this.sharedElementTransitionLayer.current?.ref.current?.close();
        this.animation.effect = null;
      })
      .catch(() => {}); // catch AbortError

    return this.animation;
  }

  public render() {
    return (
      <ScreenTransitionLayerContext.Provider value={this}>
        <SharedElementTransitionLayer
          ref={this.sharedElementTransitionLayer}
          navigation={this.props.navigation}
          direction={this.animation.playbackRate > 0 ? 'forwards' : 'backwards'}
        />
        {this.props.children}
      </ScreenTransitionLayerContext.Provider>
    );
  }
}