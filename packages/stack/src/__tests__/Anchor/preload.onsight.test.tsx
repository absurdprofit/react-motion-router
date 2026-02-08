import {
  assertNavigationAvailable,
  FIRST_INDEX,
  installInterceptor,
  LAST_INDEX,
  traverseToStart,
  uninstallInterceptor
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

describe('Anchor.preload (onsight)', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('calls navigation.preload if in view', async () => {
    const onPreload = vi.fn();
    await window.navigation.transition?.finished;
    window.navigation.addEventListener('navigate', onPreload);
    await act(() => {
      return render(
        <Anchor href='preload' preload preloadBehaviour={{ type: 'onsight' }}>
        Preload
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='preload'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );
    });

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

  it('doesn\'t call navigation.preload if not in view', async () => {
    const onPreload = vi.fn();
    await window.navigation.transition?.finished;
    window.navigation.addEventListener('navigate', onPreload);
    await act(() => {
      return render(
        <Anchor
          href='preload'
          preload
          preloadBehaviour={{ type: 'onsight' }}
          style={{
            marginLeft: window.screen.width,
          }}
        >
        Preload
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='preload'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );
    });

    expect(
      onPreload.mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    ).toMatchObject({
      navigationType: 'load',
    });
  });

  it('respects root config', async () => {
    const onPreload = vi.fn();
    await window.navigation.transition?.finished;
    window.navigation.addEventListener('navigate', onPreload);
    const { unmount } = await act(async () => {
      const result = render(
        <Anchor
          href='preload'
          preload
          preloadBehaviour={{ type: 'onsight', root: document.body }}
          style={{
            marginRight: '50vw',
          }}
        >
        Preload
        </Anchor>,
        {
          wrapper(props) {
            return (
              <div style={{ width: '10px' }}>
                <Router config={{ basePath: globalThis.location.pathname }}>
                  <Screen
                    path='preload'
                    component={() => null}
                  />
                  <Screen path='.' component={() => <>{props.children}</>} />
                </Router>
              </div>
            );
          },
        }
      );

      // wait for intersection observer
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      return result;
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

    onPreload.mockReset();
    unmount();

    await act(() => {
      return render(
        <Anchor
          href='preload'
          preload
          preloadBehaviour={{ type: 'onsight' }}
          style={{
            marginRight: '50vw',
          }}
        >
        Preload
        </Anchor>,
        {
          wrapper(props) {
            return (
              <div style={{ width: '10px' }}>
                <Router config={{ basePath: globalThis.location.pathname }}>
                  <Screen
                    path='preload'
                    component={() => null}
                  />
                  <Screen path='.' component={() => <>{props.children}</>} />
                </Router>
              </div>
            );
          },
        }
      );
    });

    expect(
      onPreload.mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    ).toMatchObject({
      navigationType: 'load',
    });
  });

  it('respects threshold config', async () => {
    const onPreload = vi.fn();
    await window.navigation.transition?.finished;
    window.navigation.addEventListener('navigate', onPreload);
    const { unmount } = await act(async () => {
      const threshold = .5;
      const result = render(
        <Anchor
          href='preload'
          preload
          preloadBehaviour={{ type: 'onsight', threshold }}
          style={{
            marginRight: '40vw',
          }}
        >
        Preload
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='preload'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );

      // wait for intersection observer
      await new Promise(resolve => requestAnimationFrame(resolve));

      return result;
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

    onPreload.mockReset();
    unmount();

    await act(() => {
      const threshold = 1;
      return render(
        <Anchor
          href='preload'
          preload
          preloadBehaviour={{ type: 'onsight', threshold }}
          style={{
            marginLeft: '40vw',
          }}
        >
        Preload
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='preload'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );
    });

    expect(
      onPreload.mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    ).toMatchObject({
      navigationType: 'load',
    });
  });
});