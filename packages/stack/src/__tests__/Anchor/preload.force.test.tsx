import {
  assertNavigationAvailable,
  FIRST_INDEX,
  installInterceptor,
  LAST_INDEX,
  traverseToStart,
  uninstallInterceptor,
  waitForNavigation
} from '@react-motion-router/core';
import { act, cleanup, render } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';
import { Anchor } from '../../Anchor';
import { Router } from '../../Router';
import { Screen } from '../../Screen';

describe('Anchor.preload (force)', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('preloads on mount by default', async () => {
    const onPreload = vi.fn();
    await window.navigation.transition?.finished;
    window.navigation.addEventListener('navigate', onPreload);
    const forLoad = waitForNavigation('load');
    await act(async () => {
      return render(
        <Router config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='preload'
            component={() => null}
          />
          <Screen path='.' component={() => (
            <Anchor href='preload' preload preloadBehaviour={{ type: 'force' }}>
              Preload
            </Anchor>
          )} />
        </Router>
      );
    });

    await act(() => forLoad);

    expect(
      onPreload.mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    ).toMatchObject({
      navigationType: 'preload',
    });

    expect(
      onPreload.mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
        .destination
    ).toMatchObject({
      url: new URL(
        'preload',
        `${globalThis.origin}${globalThis.location.pathname}`
      ).href,
    });
  });
});