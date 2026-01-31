import { Router } from '../../Router';
import { act, renderHook } from '@testing-library/react';
import { Screen } from '../../Screen';
import { useNavigation } from '../../common/hooks';
import { describe, expect, it, vi } from 'vitest';

describe('Navigation.preload', () => {
  it('returns true', async () => {
    const onLoad = vi.fn();
    const navigation = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper(props) {
          return (
            <Router config={{ basePath: window.location.pathname }}>
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
    
    expect(await navigation.result.current.preload('preload')).toBe(true);
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
    const navigation = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper,
      });
    });
    
    expect(await navigation.result.current.preload('preload')).toBe(true);
    expect(onLoad).toBeCalled();
  });
});