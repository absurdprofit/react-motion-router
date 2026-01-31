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
  SECOND_INDEX,
  THIRD_INDEX
} from './common/constants';

describe('Navigation.entries', () => {
  beforeAll(installInterceptor);

  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();
    await traverseToStart();
  });

  afterAll(uninstallInterceptor);

  it('filters out entries owned by nested routes', async () => {
    const navigation = new Navigation({
      getPathPatterns: () => [
        { pattern: '.', caseSensitive: false },
        { pattern: 'world/**', caseSensitive: false },
        { pattern: 'hello-world/**', caseSensitive: false },
      ],
      baseURLPattern: new URLPattern('/', globalThis.location.origin),
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

  it('filters out entries owned by multiple nested scopes', async () => {
    const navigation = new Navigation({
      getPathPatterns: () => [
        { pattern: '.', caseSensitive: false },
        { pattern: 'world/**', caseSensitive: false },
        { pattern: 'hello-world/**', caseSensitive: false },
      ],
      baseURLPattern: new URLPattern('/', globalThis.location.origin),
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
});
