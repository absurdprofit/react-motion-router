import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Screen, ScreenComponentProps, ScreenConfig } from '../Screen';
import { useEffect, useRef } from 'react';
import { androidScaleFromCentre } from '../animation-configs/animation-presets';
import { Router } from '../Router';

describe('Screen.setConfig', () => {
  async function update() {
    window.dispatchEvent(new Event('--test-update'));
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  const config: Partial<ScreenConfig> = {
    animation: androidScaleFromCentre,
    header: { component: () => null },
    footer: { component: () => null },
    onEnter: (props) => new Promise(() => props),
    onEntered: (props) => new Promise(() => props),
    onExit: (props) => new Promise(() => props),
    onExited: (props) => new Promise(() => props),
    onLoad: (props) => new Promise(() => props),
  };
  function TestComponent(props: ScreenComponentProps) {
    const renders = useRef(Number());
    useEffect(() => {
      if (renders.current || !props.route.focused) return;
      window.addEventListener('--test-update', () => {
        props.route.setConfig(config);
      }, { once: true });
      renders.current++;
    }, [props.route]);

    const { route } = props;

    return (
      <div data-testid='output'>
        {
          String(
            route.config.animation === config.animation
            && route.config.header?.component === config.header?.component
            && route.config.footer?.component === config.footer?.component
            && route.config.onEnter === config.onEnter
            && route.config.onEntered === config.onEntered
            && route.config.onExit === config.onExit
            && route.config.onExited === config.onExited
            && route.config.onLoad === config.onLoad
          )
        }
      </div>
    );
  }
  it('does not throw', async () => {
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
    
    const output = screen.getByTestId('output');

    expect(output.textContent).toBe('true');
  });
  it('filters out non-cloneable keys', async () => {
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
          config: {},
        },
      });
  });
});