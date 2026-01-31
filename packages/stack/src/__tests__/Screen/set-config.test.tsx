import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Screen, ScreenComponentProps, ScreenConfig } from '../../Screen';
import { useEffect, useRef } from 'react';
import {
  androidScaleFromCentre
} from '../../animation-configs/animation-presets';
import { Router } from '../../Router';
import {
  FIRST_INDEX,
  LAST_INDEX,
  useRerender,
  triggerRerender,
  useRerenderCallback
} from '@react-motion-router/core';

describe('Screen.setConfig', () => {
  const TestComponentChild = vi.fn(() => null);
  function TestComponentFactory(config: Partial<ScreenConfig>) {
    return function TestComponent(props: ScreenComponentProps) {
      const renders = useRef(Number());
      useRerender();
      useRerenderCallback(() => {
        if (renders.current || !props.route.focused) return;
        props.route.setConfig(config);
        renders.current++;
      });

      const { route } = props;

      const Child: React.FC<{ config: object }> = TestComponentChild;
  
      return (
        <Child config={route.config} />
      );
    };
  }

  beforeEach(() => {
    TestComponentChild.mockReset();
    window.navigation.updateCurrentEntry({ state: null });
  });
 
  it('does not throw', async () => {
    const config: Required<ScreenConfig> = {
      animation: androidScaleFromCentre,
      header: { component: () => null },
      footer: { component: () => null },
      onEnter: (props) => new Promise(() => props),
      onEntered: (props) => new Promise(() => props),
      onExit: (props) => new Promise(() => props),
      onExited: (props) => new Promise(() => props),
      onLoad: (props) => new Promise(() => props),
      title: 'Test',
      gestureAreaWidth: Number(),
      gestureDirection: 'horizontal',
      gestureDisabled: true,
      gestureHysteresis: Number(),
      gestureMinFlingVelocity: Number(),
      keepAlive: false,
      presentation: 'default',
    };
    const TestComponent = TestComponentFactory(config);
    const onError = vi.fn();
    globalThis.addEventListener('error', onError, { once: true });
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(async () => {
      triggerRerender();
    });
    const calledTimes = 0;
    expect(onError).toBeCalledTimes(calledTimes);
  });
  it('updates the config', async () => {
    const config: Partial<ScreenConfig> = {
      presentation: 'default',
    };
    const TestComponent = TestComponentFactory(config);
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(async () => {
      triggerRerender();
    });
    
    expect(
      TestComponentChild
        .mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    )
      .toMatchObject({ config });
  });
  it('filters out non-cloneable keys', async () => {
    const config: Required<ScreenConfig> = {
      animation: androidScaleFromCentre,
      header: { component: () => null },
      footer: { component: () => null },
      onEnter: (props) => new Promise(() => props),
      onEntered: (props) => new Promise(() => props),
      onExit: (props) => new Promise(() => props),
      onExited: (props) => new Promise(() => props),
      onLoad: (props) => new Promise(() => props),
      title: 'Test',
      gestureAreaWidth: Number(),
      gestureDirection: 'horizontal',
      gestureDisabled: true,
      gestureHysteresis: Number(),
      gestureMinFlingVelocity: Number(),
      keepAlive: false,
      presentation: 'default',
    };
    const TestComponent = TestComponentFactory(config);

    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });

    await act(async () => {
      triggerRerender();
    });

    const state = window.navigation.currentEntry?.getState();
    expect(state)
      .toMatchObject({
        config: {
          title: 'Test',
          gestureAreaWidth: Number(),
          gestureDirection: 'horizontal',
          gestureDisabled: true,
          gestureHysteresis: Number(),
          gestureMinFlingVelocity: Number(),
          keepAlive: false,
          presentation: 'default',
        },
      });
  });

  it('merges with existing config', async () => {
    const config: Partial<ScreenConfig> = {
      gestureAreaWidth: Number(),
      gestureDirection: 'horizontal',
      gestureDisabled: true,
      gestureHysteresis: Number(),
      gestureMinFlingVelocity: Number(),
      keepAlive: false,
      presentation: 'default',
    };
    const TestComponent = TestComponentFactory(config);
    await act(async () => {
      render(
        <Router>
          <Screen
            path='*'
            component={TestComponent}
            config={{ title: 'hello world' }}
          />
        </Router>
      );
    });
    await act(async () => {
      triggerRerender();
    });

    expect(
      TestComponentChild
        .mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    )
      .toMatchObject({
        config: {
          title: 'hello world',
          gestureAreaWidth: Number(),
          gestureDirection: 'horizontal',
          gestureDisabled: true,
          gestureHysteresis: Number(),
          gestureMinFlingVelocity: Number(),
          keepAlive: false,
          presentation: 'default',
        },
      });
  });

  it('survives separate mounts', async () => {
    const TestComponent = TestComponentFactory({ gestureAreaWidth: Number() });
    const { unmount } = await act(async () => {
      return render(
        <Router>
          <Screen
            path='*'
            component={TestComponent}
            config={{ presentation: 'default' }}
          />
        </Router>
      );
    });

    await act(async () => {
      triggerRerender();
    });

    unmount();

    TestComponentChild.mockReset();

    await act(async () => {
      render(
        <Router>
          <Screen
            path='*'
            component={TestComponent}
            config={{ presentation: 'default' }}
          />
        </Router>
      );
    });

    expect(
      TestComponentChild
        .mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    )
      .toMatchObject({
        config: {
          gestureAreaWidth: Number(),
          presentation: 'default',
        },
      });
  });
});