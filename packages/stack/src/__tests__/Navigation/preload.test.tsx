import { Router } from '../../Router';
import { act, renderHook } from '@testing-library/react';
import { Screen } from '../../Screen';
import { useNavigation } from '../../common/hooks';
import { assert, describe, expect, it, vi } from 'vitest';
import { Navigation } from '../../Navigation';

describe('Navigation.preload', () => {
  it('returns true', async () => {
    const onLoad = vi.fn();
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
    const result = navigation.preload('preload');
    expect(result.finished).toBe(navigation.transition?.finished);
    expect((await result.finished).url?.endsWith('preload')).toBe(true);
    expect(onLoad).toBeCalled();
  });

  it('returns true for nested screens', async () => {
    const onLoad = vi.fn();
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
          <Screen path='*' component={NestedRouterComponent} />
        </Router>
      );
    };
    const { result: { current: navigation } } = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper,
      });
    });
    
    assert(navigation instanceof Navigation);
    const result = act(() => navigation.preload('preload'));
    // expect(result.finished).toBe(navigation.transition?.finished);
    expect((await result.finished).url?.endsWith('preload')).toBe(true);
    expect(onLoad).toBeCalled();
  });
});