import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Screen, ScreenComponentProps, ScreenConfig } from '../../Screen';
import { useEffect, useRef } from 'react';
import {
  androidScaleFromCentre
} from '../../animation-configs/animation-presets';
import { Router } from '../../Router';
import { FIRST_INDEX, LAST_INDEX } from '@react-motion-router/core';

describe('Screen.setConfig', () => {
  async function update() {
    window.dispatchEvent(new Event('--test-update'));
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  
  const TestComponentChild = vi.fn(() => null);
  function TestComponentFactory(config: Partial<ScreenConfig>) {
    return function TestComponent(props: ScreenComponentProps) {
      const renders = useRef(Number());
      useEffect(() => {
        if (renders.current || !props.route.focused) return;
        window.addEventListener('--test-update', () => {
          props.route.setConfig(config);
        }, { once: true });
        renders.current++;
      }, [props.route]);

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
    window.addEventListener('error', onError, { once: true });
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(async () => {
      await update();
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
      await update();  
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
    window.navigation.updateCurrentEntry = vi.fn();
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(async () => {
      await update();
    });
    expect(window.navigation.updateCurrentEntry)
      .toBeCalledWith({
        state: {
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
      await update();
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
});