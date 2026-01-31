import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Screen, ScreenComponentProps } from '../../Screen';
import { useRef } from 'react';
import { Router } from '../../Router';
import {
  FIRST_INDEX,
  LAST_INDEX,
  triggerRerender,
  useRerender,
  useRerenderCallback
} from '@react-motion-router/core';

describe('Screen.setParams', () => {
  const TestComponentChild = vi.fn(() => null);
  type TestComponentProps = ScreenComponentProps<
    Record<string, unknown>
  >;
  function TestComponentFactory(params: Record<string, unknown>) {
    return function TestComponent(props: TestComponentProps) {
      const renders = useRef(Number());
      useRerender();
      useRerenderCallback(() => {
        if (renders.current || !props.route.focused) return;
        props.route.setParams(params);
        renders.current++;
      });
  
      const { route } = props;
      const Child: React.FC<{ params: object }> = TestComponentChild;
  
      return (
        <Child params={route.params} />
      );
    };
  }

  beforeEach(() => {
    TestComponentChild.mockReset();
    window.navigation.updateCurrentEntry({ state: null });
  });

  it('throws for non-structured-cloneable objects', async () => {
    const onError = vi.fn();
    globalThis.addEventListener('error', onError, { once: true });
    const TestComponent = TestComponentFactory({ globalThis });
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(() => {
      triggerRerender();
    });
    const calledTimes = 1;
    expect(onError).toBeCalledTimes(calledTimes);
  });

  it('updates the params', async () => {
    const params = { world: 'hello' };
    const TestComponent = TestComponentFactory(params);
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(() => {
      triggerRerender();  
    });
      
    expect(
      TestComponentChild
        .mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    )
      .toMatchObject({ params });
  });

  it('updates the history entry state', async () => {
    const TestComponent = TestComponentFactory({ world: 'hello' });
    await act(async () => {
      render(
        <Router>
          <Screen path='*' component={TestComponent} />
        </Router>
      );
    });
    await act(() => {
      triggerRerender();  
    });
      
    const state = window.navigation.currentEntry?.getState();
    expect(state)
      .toStrictEqual({
        params: {
          world: 'hello',
        },
      });
  });

  it('merges with existing params', async () => {
    const TestComponent = TestComponentFactory({ world: 'hello' });
    await act(async () => {
      render(
        <Router>
          <Screen
            path='*'
            component={TestComponent}
            defaultParams={{ hello: 'world' }}
          />
        </Router>
      );
    });
    await act(() => {
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
        params: {
          world: 'hello',
          hello: 'world',
        },
      });
  });

  it('survives separate mounts', async () => {
    const TestComponent = TestComponentFactory({ world: 'hello' });
    const { unmount } = await act(async () => {
      return render(
        <Router>
          <Screen
            path='*'
            component={TestComponent}
            defaultParams={{ hello: 'world' }}
          />
        </Router>
      );
    });

    await act(() => {
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
            defaultParams={{ hello: 'world' }}
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
        params: {
          world: 'hello',
          hello: 'world',
        },
      });
  });
});