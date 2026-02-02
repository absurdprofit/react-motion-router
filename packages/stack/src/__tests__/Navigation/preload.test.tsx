import { Router } from '../../Router';
import { act, renderHook } from '@testing-library/react';
import { Screen } from '../../Screen';
import { useNavigation } from '../../common/hooks';
import { assert, describe, expect, it, vi } from 'vitest';
import { Navigation } from '../../Navigation';
import {
  FIRST_INDEX,
  LAST_INDEX,
  LifecycleProps
} from '@react-motion-router/core';
import { RouteProp } from '../../common/types';

describe('Navigation.preload', () => {
  it('returns NavigationResult', async () => {
    const onTransition = vi.fn();
    const onLoad = vi.fn((props: LifecycleProps<RouteProp>) => {
      onTransition((props.navigation as Navigation).transition);
    });
    const { result: { current: navigation } } = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper(props) {
          return (
            <Router config={{ basePath: globalThis.location.pathname }}>
              <Screen
                path='preload'
                component={() => null}
                config={{ onLoad }}
              />
              <Screen path='.' component={() => <>{props.children}</>} />
            </Router>
          );
        },
      });
    });
    
    assert(navigation instanceof Navigation);
    const result = await act(() => navigation.preload('preload'));

    expect((await result.finished).url?.endsWith('preload')).toBe(true);
    expect(onLoad).toBeCalled();
    expect(
      onTransition.mock
        .calls
        .at(FIRST_INDEX)
        ?.at(LAST_INDEX)
    ).toMatchObject({
      finished: result.finished,
    });
  });

  it('returns NavigationResult for nested screens', async () => {
    const onTransition = vi.fn();
    const onLoad = vi.fn((props: LifecycleProps<RouteProp>) => {
      onTransition((props.navigation as Navigation).transition);
    });
    function wrapper(props: { children: unknown }) {
      function NestedRouterComponent() {
        return (
          <Router>
            <Screen
              path='preload'
              component={() => null}
              config={{ onLoad }}
            />
            <Screen path='.' component={() => <>{props.children}</>} />
          </Router>
        );
      }
      return (
        <Router config={{ basePath: globalThis.location.pathname }}>
          <Screen path='**' component={NestedRouterComponent} />
        </Router>
      );
    };
    const { result: { current: navigation } } = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper,
      });
    });
    
    assert(navigation instanceof Navigation);
    const result = await act(() => navigation.preload('preload'));

    expect((await result.finished).url?.endsWith('preload')).toBe(true);
    expect(onLoad).toBeCalled();
    expect(
      onTransition.mock
        .calls
        .at(FIRST_INDEX)
        ?.at(LAST_INDEX)
    ).toMatchObject({
      finished: result.finished,
    });
  });

  it('returns NavigationResult for parent screens', async () => {
    const onTransition = vi.fn();
    const onLoad = vi.fn((props: LifecycleProps<RouteProp>) => {
      onTransition((props.navigation as Navigation).transition);
    });
    function wrapper(props: { children: unknown }) {
      function NestedRouterComponent() {
        return (
          <Router>
            <Screen path='.' component={() => <>{props.children}</>} />
          </Router>
        );
      }
      const { pathname } = globalThis.location;
      return (
        <Router config={{ basePath: globalThis.location.pathname }}>
          <Screen path={`${pathname}/**`} component={NestedRouterComponent} />
          <Screen
            path='preload'
            component={() => null}
            config={{ onLoad }}
          />
        </Router>
      );
    };
    const { result: { current: navigation } } = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper,
      });
    });
    
    assert(navigation instanceof Navigation);
    const result = await act(() => navigation.preload('preload'));

    expect((await result.finished).url?.endsWith('preload')).toBe(true);
    expect(onLoad).toBeCalled();
    expect(
      onTransition.mock
        .calls
        .at(FIRST_INDEX)
        ?.at(LAST_INDEX)
    ).toMatchObject({
      finished: result.finished,
    });
  });
});