import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} from 'vitest';
import { Navigation, NavigationConfig } from '../../Navigation';
import {
  assertNavigationAvailable,
  installInterceptor,
  uninstallInterceptor,
  traverseToStart
} from '@react-motion-router/core';
import { cleanup } from '@testing-library/react';
import {
  FIRST_INDEX,
  FOURTH_INDEX,
  SECOND_INDEX
} from './common/constants';

describe('Navigation.entries', () => {
  beforeAll(installInterceptor);

  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();
    await traverseToStart();
  });

  afterAll(uninstallInterceptor);

  it('keeps the first entry owned by nested routers', async () => {
    const navigation = new Navigation({
      getPathPatterns: () => [
        { pattern: '.', caseSensitive: false },
        { pattern: 'world/**', caseSensitive: false },
      ],
      baseURLPattern: new URLPattern('/', globalThis.location.origin),
      getDestination: () => null,
    } as NavigationConfig);

    // top-level
    window.navigation.navigate('/', { history: 'replace' });
    window.navigation.navigate('/world/1');
    window.navigation.navigate('/world/2');

    const entries = navigation.entries;

    expect(entries.map(e => e.index)).toStrictEqual([
      FIRST_INDEX,
      SECOND_INDEX,
    ]);
  });

  it('filters out entries owned by nested routers', async () => {
    const navigation = new Navigation({
      getPathPatterns: () => [
        { pattern: '.', caseSensitive: false },
        { pattern: 'world/**', caseSensitive: false },
        { pattern: 'hello-world/**', caseSensitive: false },
      ],
      baseURLPattern: new URLPattern('/', globalThis.location.origin),
      getDestination: () => null,
    } as NavigationConfig);

    // top-level
    window.navigation.navigate('/', { history: 'replace' });
    window.navigation.navigate('/world');

    // nested (should be excluded)
    window.navigation.navigate('/world/1');

    const entries = navigation.entries;

    expect(entries.map(e => e.index)).toStrictEqual([
      FIRST_INDEX,
      SECOND_INDEX,
    ]);
  });

  it('filters out entries owned by multiple nested routers', async () => {
    const navigation = new Navigation({
      getPathPatterns: () => [
        { pattern: '.', caseSensitive: false },
        { pattern: 'world/**', caseSensitive: false },
        { pattern: 'hello-world/**', caseSensitive: false },
      ],
      baseURLPattern: new URLPattern('/', globalThis.location.origin),
      getDestination: () => null,
    } as NavigationConfig);

    window.navigation.navigate('/', { history: 'replace' });
    window.navigation.navigate('/world/1');
    window.navigation.navigate('/world/2');
    window.navigation.navigate('/hello-world/1');
    window.navigation.navigate('/hello-world/2');

    const entries = navigation.entries;

    expect(entries.map(e => e.globalIndex)).toStrictEqual([
      FIRST_INDEX,
      SECOND_INDEX,
      FOURTH_INDEX,
    ]);
  });

  it(
    'enforces contiguity at the boundary created by entries owned by other non-nested routers',
    async () => {
      const navigation = new Navigation({
        getPathPatterns: () => [
          { pattern: '.', caseSensitive: false },
          { pattern: 'world/**', caseSensitive: false },
          { pattern: 'hello-world/**', caseSensitive: false },
        ],
        baseURLPattern: new URLPattern(
          '/nested/**',
          globalThis.location.origin
        ),
        getDestination: () => null,
      } as NavigationConfig);

      window.navigation.navigate('/nested', { history: 'replace' });
      window.navigation.navigate('/nested/world/1');
      window.navigation.navigate('/other-nested/1');
      window.navigation.navigate('/nested/hello-world/1');

      const entries = navigation.entries;

      expect(entries.map(e => e.globalIndex)).toStrictEqual([
        FIRST_INDEX,
        SECOND_INDEX,
      ]);
    }
  );
});
