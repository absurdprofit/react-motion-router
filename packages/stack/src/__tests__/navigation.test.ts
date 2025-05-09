import { expect, test } from 'vitest';
import { Navigation } from '../Navigation';
import { Router } from '../Router';

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
    window.navigation.entries = () => {
      return [
        ...expectTopLevelEntries,
        createHistoryEntry(new URL('hello-world/1', origin).toString(), FOURTH_INDEX),
      ];
    };
    expect(navigation.entries.map(entry => entry.index))
      .toStrictEqual(expectTopLevelEntries.map(entry => entry.index));
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
    window.navigation.entries = () => {
      return [
        ...expectTopLevelEntries,
        createHistoryEntry(new URL('world/1', origin).toString(), THIRD_INDEX),
        createHistoryEntry(new URL('hello-world/1', origin).toString(), FOURTH_INDEX),
      ];
    };
    expect(navigation.entries.map(entry => entry.globalIndex))
      .toStrictEqual(expectTopLevelEntries.map(entry => entry.index));
  }
});

// TODO: add test case for above test in nested router scenario