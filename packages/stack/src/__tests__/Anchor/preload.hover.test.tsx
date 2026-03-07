import {
  assertNavigationAvailable,
  FIRST_INDEX,
  installInterceptor,
  LAST_INDEX,
  traverseToStart,
  uninstallInterceptor,
  waitForNavigation
} from '@react-motion-router/core';
import { act, cleanup, render, waitFor } from '@testing-library/react';
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
import { userEvent } from 'vitest/browser';

describe('Anchor.preload (onsight)', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('calls navigation.preload if hovered', async () => {
    const onPreload = vi.fn();
    const forLoad = waitForNavigation('load');
    window.navigation.addEventListener('navigate', onPreload);
    await act(() => {
      return render(
        <Router config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='preload'
            component={() => null}
          />
          <Screen path='.' component={() => (
            <Anchor
              id='preload'
              href='preload'
              preload
              preloadBehaviour={{ type: 'onhover' }}
            >
              Preload
            </Anchor>
          )} />
        </Router>
        
      );
    });

    await act(() => forLoad);

    const a = document.querySelector('#preload');
    await act(async () => {
      if (!a) return;
      await userEvent.hover(a);
    });

    const navigateEvent = onPreload.mock
      .calls
      .at(LAST_INDEX)
      ?.at(FIRST_INDEX);
    await waitFor(() => {
      expect(navigateEvent).toMatchObject({
        navigationType: 'preload',
      });
    });

    expect(navigateEvent.destination)
      .toMatchObject({
        url: new URL(
          'preload',
          `${globalThis.origin}${globalThis.location.pathname}`
        ).href,
      });
  });

  it('doesn\'t call navigation.preload if not hovered', async () => {
    const onPreload = vi.fn();
    await window.navigation.transition?.finished;
    window.navigation.addEventListener('navigate', onPreload);
    await act(() => {
      return render(
        <Router config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='preload'
            component={() => null}
          />
          <Screen path='.' component={() => (
            <Anchor
              href='preload'
              preload
              preloadBehaviour={{ type: 'onhover' }}
              style={{
                marginLeft: window.screen.width,
              }}
            >
              Preload
            </Anchor>
          )} />
        </Router>
      );
    });

    const navigateEvent = onPreload.mock
      .calls
      .at(LAST_INDEX)
      ?.at(FIRST_INDEX);
    expect(navigateEvent).toMatchObject({
      navigationType: 'load',
    });
  });

  it('respects pressureThreshold config', async () => {
    const onPreload = vi.fn();
    const pressureThreshold = 0.5;
    const forLoad = waitForNavigation('load');
    window.navigation.addEventListener('navigate', onPreload);
    await act(() => {
      return render(
        <Router config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='preload'
            component={() => null}
          />
          <Screen path='.' component={() => (
            <Anchor
              id='preload'
              href='preload'
              preload
              preloadBehaviour={{ type: 'onhover', pressureThreshold }}
            >
              Preload
            </Anchor>
          )} />
        </Router>
        
      );
    });

    await act(() => forLoad);

    const a = document.querySelector('#preload');
    await act(async () => {
      if (!a) return;
      await userEvent.hover(a);
    });

    const navigateEvent = onPreload.mock
      .calls
      .at(LAST_INDEX)
      ?.at(FIRST_INDEX);
    expect(navigateEvent).toMatchObject({
      navigationType: 'load',
    });
  });
});