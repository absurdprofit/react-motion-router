import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RouterContext } from '../RouterContext';
import { ScreenTransitionLayerContext } from '../ScreenTransitionLayerContext';
import { useMotion } from '../common/hooks';
import { dispatchEvent } from '../common/utils';
import { ScreenTransitionLayer } from '../ScreenTransitionLayer';
import { RouterBase } from '../RouterBase';
import { triggerRerender, useRerender } from '../common/test-utils';

const MockRouter = {
  target: new EventTarget(),
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    const ref = this.target;
    if (!ref) return () => {};
    ref.addEventListener(type, listener, options);
    return () => ref.removeEventListener(type, listener, options);
  },
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) {
    return this.target.removeEventListener(type, listener, options);
  },
  dispatchEvent(event: Event) {
    const ref = this.target;
    return dispatchEvent(event, ref);
  },
};

const ANIMATION_DURATION = 100;
const HALF = 2;
const HALF_ANIMATION_DURATION = ANIMATION_DURATION / HALF;
const MockScreenTransitionLayer = {
  animation: new Animation(),
  onTransitionCancel() {
    MockRouter.dispatchEvent(new TransitionEvent('routertransitioncancel'));
  },
  onTransitionStart() {
    MockRouter.dispatchEvent(new TransitionEvent('routertransitionstart'));
  },
  onTransitionEnd() {
    MockRouter.dispatchEvent(new TransitionEvent('routertransitionend'));
  },
  transition(target: HTMLElement = document.body) {
    const start = 0;
    const end = 1;
    const effect = new KeyframeEffect(
      target,
      [{ opacity: start }, { opacity: end }],
      { duration: ANIMATION_DURATION }
    );

    this.animation.effect = effect;

    this.animation.play();
    this.onTransitionStart();

    this.animation.oncancel = () => {
      this.onTransitionCancel();
      this.animation.effect = null;
    };
    this.animation.finished.then(() => {
      this.onTransitionEnd();
      this.animation.effect = null;
    }).catch(() => {});

    return this.animation;
  },
};

describe('useMotion', () => {
  function TestMotionComponent() {
    const progress = useMotion();
    return <>{progress}</>;
  }
  
  it('doesn\'t cause rerenders higher in the tree', async () => {
    let renders = Number();
    function TestComponent() {
      renders++;
      MockScreenTransitionLayer.transition();
      return <TestMotionComponent />; 
    }
    await act(async () => {
      render(
        <RouterContext.Provider value={MockRouter as unknown as RouterBase}>
          <ScreenTransitionLayerContext.Provider
            value={(
              MockScreenTransitionLayer as unknown as ScreenTransitionLayer
            )}
          >
            <TestComponent />
          </ScreenTransitionLayerContext.Provider>
        </RouterContext.Provider>
      );
    });

    await act(async () => {
      await MockScreenTransitionLayer
        .animation
        .finished
        .then(() => {
          return new Promise(requestAnimationFrame);
        });
    });
    const RENDER_MAX = 1;
    expect(renders).toBe(RENDER_MAX);
  });

  it('starts with 0', async () => {
    function TestComponent() {
      MockScreenTransitionLayer.transition();
      return <TestMotionComponent />; 
    }
    await act(async () => {
      render(
        <RouterContext.Provider value={MockRouter as unknown as RouterBase}>
          <ScreenTransitionLayerContext.Provider
            value={(
              MockScreenTransitionLayer as unknown as ScreenTransitionLayer
            )}
          >
            <TestComponent />
          </ScreenTransitionLayerContext.Provider>
        </RouterContext.Provider>
      );
    });

    const progress = screen.getByText('0');
    expect(progress).toBeDefined();
  });

  it('restarts with 0', async () => {
    function TestComponent() {
      useRerender();
      MockScreenTransitionLayer.transition();
      return <TestMotionComponent />; 
    }
    const tree = (
      <RouterContext.Provider value={MockRouter as unknown as RouterBase}>
        <ScreenTransitionLayerContext.Provider
          value={(
            MockScreenTransitionLayer as unknown as ScreenTransitionLayer
          )}
        >
          <TestComponent />
        </ScreenTransitionLayerContext.Provider>
      </RouterContext.Provider>
    );
    const { rerender } = await act(async () => {
      return render(tree);
    });

    await act(async () => {
      await MockScreenTransitionLayer
        .animation
        .finished
        .then(() => {
          return new Promise(requestAnimationFrame);
        });
    });

    await act(async () => {
      MockScreenTransitionLayer.animation = new Animation();
      triggerRerender();
      rerender(tree);
    });

    const progress = screen.getByText('0');
    expect(progress).toBeDefined();
  });

  it('ends with the last value being 1', async () => {
    function TestComponent() {
      MockScreenTransitionLayer.transition();
      return <TestMotionComponent />; 
    }
    await act(async () => {
      render(
        <RouterContext.Provider value={MockRouter as unknown as RouterBase}>
          <ScreenTransitionLayerContext.Provider
            value={(
              MockScreenTransitionLayer as unknown as ScreenTransitionLayer
            )}
          >
            <TestComponent />
          </ScreenTransitionLayerContext.Provider>
        </RouterContext.Provider>
      );
    });

    await act(async () => {
      await MockScreenTransitionLayer
        .animation
        .finished
        .then(() => {
          return new Promise(requestAnimationFrame);
        });
    });
    const progress = screen.getByText('1');
    expect(progress).toBeDefined();
  });

  it('ends with the last value being 1 if animation is cancelled', async () => {
    function TestComponent() {
      MockScreenTransitionLayer.transition();
      return <TestMotionComponent />; 
    }
    await act(async () => {
      render(
        <RouterContext.Provider value={MockRouter as unknown as RouterBase}>
          <ScreenTransitionLayerContext.Provider
            value={(
              MockScreenTransitionLayer as unknown as ScreenTransitionLayer
            )}
          >
            <TestComponent />
          </ScreenTransitionLayerContext.Provider>
        </RouterContext.Provider>
      );
    });

    // cancel animation
    await act(async () => {
      await new Promise(resolve => {
        setTimeout(() => {
          MockScreenTransitionLayer.animation.cancel();
          requestAnimationFrame(resolve);
        }, HALF_ANIMATION_DURATION);
      });
    });
    const progress = screen.getByText('1');
    expect(progress).toBeDefined();
  });

  afterEach(() => {
    cleanup();
  });
});