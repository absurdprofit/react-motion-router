import { describe, expect, it, test, vi } from 'vitest';
import { Navigation } from '../Navigation';
import { Router } from '../Router';
import { act, render, renderHook } from '@testing-library/react';
import { Screen } from '../Screen';
import { useNavigation } from '../common/hooks';

function createHistoryEntry(url: string, index: number):  NavigationHistoryEntry {
  return {
    ...new EventTarget(),
    id: crypto.randomUUID().toString(),
    key: crypto.randomUUID().toString(),
    index,
    url,
    sameDocument: true,
    ondispose: null,
    getState() {
      return undefined;
    },
  };
}

test('entries getter filters out global entries owned by nested routes', () => {
  const navigation = new Navigation({
    pathPatterns: [
      {
        pattern: '.',
        caseSensitive: false,
      },
      {
        pattern: 'hello',
        caseSensitive: false,
      },
      {
        pattern: 'world/**',
        caseSensitive: false,
      },
      {
        pattern: 'hello-world/**',
        caseSensitive: false,
      },
    ],
    baseURLPattern: new URLPattern('/', window.location.origin),
  } as Router);

  {
    // mock history with entries from nested routers
    const origin = 'http://localhost';
    const FIRST_INDEX = 0;
    const SECOND_INDEX = 1;
    const THIRD_INDEX = 2;
    const FOURTH_INDEX = 3;
    const expectTopLevelEntries = [
      createHistoryEntry(new URL('.', origin).toString(), FIRST_INDEX),
      createHistoryEntry(new URL('world/', origin).toString(), SECOND_INDEX),
      createHistoryEntry(new URL('hello-world/', origin).toString(), THIRD_INDEX),
    ];
    const entries = window.navigation.entries;
    window.navigation.entries = () => {
      return [
        ...expectTopLevelEntries,
        createHistoryEntry(new URL('hello-world/1', origin).toString(), FOURTH_INDEX),
      ];
    };
    expect(navigation.entries.map(entry => entry.index))
      .toStrictEqual(expectTopLevelEntries.map(entry => entry.index));
    window.navigation.entries = entries;
  }
  {
    // mock history with entries from nested routers
    const origin = 'http://localhost';
    const FIRST_INDEX = 0;
    const SECOND_INDEX = 1;
    const THIRD_INDEX = 2;
    const FOURTH_INDEX = 3;
    const expectTopLevelEntries = [
      createHistoryEntry(new URL('.', origin).toString(), FIRST_INDEX),
      createHistoryEntry(new URL('world/', origin).toString(), SECOND_INDEX),
    ];
    const entries = window.navigation.entries;
    window.navigation.entries = () => {
      return [
        ...expectTopLevelEntries,
        createHistoryEntry(new URL('world/1', origin).toString(), THIRD_INDEX),
        createHistoryEntry(new URL('hello-world/1', origin).toString(), FOURTH_INDEX),
      ];
    };
    expect(navigation.entries.map(entry => entry.globalIndex))
      .toStrictEqual(expectTopLevelEntries.map(entry => entry.index));
    window.navigation.entries = entries;
  }
});
// TODO: add test case for above test in nested router scenario

describe('navigation.preload', () => {
  it('returns true', async () => {
    function PreloadComponent() {
      return null;
    }
    const onLoad = vi.fn();
    const navigation = await act(async () => {
      return renderHook(() => useNavigation(), {
        wrapper(props) {
          return (
            <Router config={{ basePath: window.location.pathname }}>
              <Screen path='preload' component={PreloadComponent} config={{ onLoad }} />
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
    function PreloadComponent() {
      return null;
    }
    const onLoad = vi.fn();
    function wrapper(props: { children: unknown }) {
      function NestedRouterComponent() {
        return (
          <Router>
            <Screen path='preload' component={PreloadComponent} config={{ onLoad }} />
            <Screen path='.' component={() => <>{props.children}</>} />
          </Router>
        );
      }
      return (
        <Router config={{ basePath: window.location.pathname }}>
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