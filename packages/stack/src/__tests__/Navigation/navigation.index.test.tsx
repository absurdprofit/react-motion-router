import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Navigation, NavigationConfig } from '../../Navigation';
import {
  assertNavigationAvailable,
  installInterceptor,
  SINGLE_ELEMENT_LENGTH,
  traverseToStart,
  uninstallInterceptor
} from '@react-motion-router/core';
import { cleanup } from '@testing-library/react';
import { FIRST_INDEX, FOURTH_INDEX } from './common/constants';

describe('Navigation.index', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('returns 0 if the current index is before its owning scope', () => {
    const navigation = new Navigation({
      getPathPatterns: () => [
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

    expect(navigation.index).toBe(FIRST_INDEX);
  });

  it(
    'returns the last entry index if the current index is owned by a nested scope',
    () => {
      const navigation = new Navigation({
        getPathPatterns: () => [
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

      window.navigation.navigate('hello');
      window.navigation.navigate('hello');
      window.navigation.navigate('world/hello');
      expect(navigation.index)
        .toBe(navigation.entries.length - SINGLE_ELEMENT_LENGTH);
    }
  );

  it('includes index of non-contiguous entries', () => {
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

    window.navigation.navigate('/hello');
    window.navigation.navigate('/world/hello');
    window.navigation.navigate('/world/world');
    window.navigation.navigate('/hello');
    
    expect(navigation.index).toBe(FOURTH_INDEX);
  });

  it('returns the closest index to the current index', async () => {
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

    window.navigation.navigate('/hello');
    window.navigation.navigate('/world/hello');
    window.navigation.navigate('/world/world');
    window.navigation.navigate('/hello');
    window.navigation.navigate('/world/hello');
    await window.navigation.back().finished;
    
    expect(navigation.index).toBe(FOURTH_INDEX);
  });
});
