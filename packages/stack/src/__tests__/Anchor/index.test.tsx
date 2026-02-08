import {
  assertNavigationAvailable,
  installInterceptor,
  traverseToStart,
  uninstallInterceptor
} from '@react-motion-router/core';
import { act, cleanup, render } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Anchor } from '../../Anchor';
import { Router } from '../../Router';
import { Screen } from '../../Screen';

describe('Anchor', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('converts params to search params', async () => {
    const { getByText } = await act(() => {
      return render(
        <Anchor href='world' params={{ hello: 'world' }}>
        World
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='world'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );
    });

    const a = getByText('World') as HTMLAnchorElement;

    expect(a.href.endsWith('?hello=world')).toBe(true);
  });

  it('doesn\'t add search params if href is unresolved', async () => {
    const { getByText } = await act(() => {
      return render(
        <Anchor params={{ hello: 'world' }}>
        World
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='world'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );
    });

    const a = getByText('World') as HTMLAnchorElement;

    expect(a.getAttribute('href')).toBe(null);
  });

  it('allows overriding search params', async () => {
    const { getByText } = await act(() => {
      return render(
        <Anchor
          href='world'
          params={{ hello: 'world' }}
          searchParams={{ world: 'hello' }}
        >
        World
        </Anchor>,
        {
          wrapper(props) {
            return (
              <Router config={{ basePath: globalThis.location.pathname }}>
                <Screen
                  path='world'
                  component={() => null}
                />
                <Screen path='.' component={() => <>{props.children}</>} />
              </Router>
            );
          },
        }
      );
    });

    const a = getByText('World') as HTMLAnchorElement;

    expect(a.href.endsWith('?world=hello')).toBe(true);
  });
});