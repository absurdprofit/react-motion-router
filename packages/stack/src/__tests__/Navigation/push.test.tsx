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
  LAST_INDEX,
  LifecycleProps,
  traverseToStart,
  uninstallInterceptor
} from '@react-motion-router/core';
import { act, cleanup, renderHook } from '@testing-library/react';
import { FIRST_INDEX } from './common/constants';
import { RouteProp } from '../../common/types';
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