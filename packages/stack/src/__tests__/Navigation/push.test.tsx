import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
  assert
} from 'vitest';
import { Navigation } from '../../Navigation';
import {
  assertNavigationAvailable,
  installInterceptor,
  traverseToStart,
  uninstallInterceptor
} from '@react-motion-router/core';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useNavigation } from '../../common/hooks';
import { Router } from '../../Router';
import { Screen } from '../../Screen';

describe('Navigation.push', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it.todo('returns NavigationResult', async () => {
    const onLoad = vi.fn();
    const { result: { current: navigation } } = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper(props) {
          return (
            <Router config={{ basePath: globalThis.location.pathname }}>
              <Screen
                path='test'
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
    const result = await act(async () => {
      const result = navigation.push('test');
      await result.committed;
      return result;
    });

    expect((await result.finished).url?.endsWith('test')).toBe(true);
    expect(onLoad).toBeCalled();
  });
});