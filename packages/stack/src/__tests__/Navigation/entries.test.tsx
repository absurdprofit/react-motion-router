import { describe, expect, it } from 'vitest';
import { Navigation, NavigationConfig } from '../../Navigation';
import { createHistoryEntry } from '@react-motion-router/core';

const FIRST_INDEX = 0;
const SECOND_INDEX = 1;
const THIRD_INDEX = 2;
const FOURTH_INDEX = 3;
describe('Navigation.entries', () => {
  it(
    'filters out global entries owned by nested routes',
    () => {
      const navigation = new Navigation({
        getPathPatterns: () => [
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
        baseURLPattern: new URLPattern('/', globalThis.location.origin),
      } as NavigationConfig);

      {
        // mock history with entries from nested routers
        const origin = 'http://localhost';
        
        const expectTopLevelEntries = [
          createHistoryEntry(new URL('.', origin).toString(), FIRST_INDEX),
          createHistoryEntry(
            new URL('world/', origin).toString(),
            SECOND_INDEX
          ),
          createHistoryEntry(
            new URL('hello-world/', origin).toString(),
            THIRD_INDEX
          ),
        ];
        const entries = window.navigation.entries;
        window.navigation.entries = () => {
          return [
            ...expectTopLevelEntries,
            createHistoryEntry(
              new URL('hello-world/1', origin).toString(),
              FOURTH_INDEX
            ),
          ];
        };
        expect(navigation.entries.map(entry => entry.index))
          .toStrictEqual(expectTopLevelEntries.map(entry => entry.index));
        window.navigation.entries = entries;
      }
      {
        // mock history with entries from nested routers
        const origin = 'http://localhost';
        const expectTopLevelEntries = [
          createHistoryEntry(new URL('.', origin).toString(), FIRST_INDEX),
          createHistoryEntry(
            new URL('world/', origin).toString(),
            SECOND_INDEX
          ),
        ];
        const entries = window.navigation.entries;
        window.navigation.entries = () => {
          return [
            ...expectTopLevelEntries,
            createHistoryEntry(
              new URL('world/1', origin).toString(),
              THIRD_INDEX
            ),
            createHistoryEntry(
              new URL('hello-world/1', origin).toString(),
              FOURTH_INDEX
            ),
          ];
        };
        expect(navigation.entries.map(entry => entry.globalIndex))
          .toStrictEqual(expectTopLevelEntries.map(entry => entry.index));
        window.navigation.entries = entries;
      }
    }
  );
});