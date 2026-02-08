import {
  assertNavigationAvailable,
  installInterceptor,
  LAST_INDEX,
  traverseToStart,
  uninstallInterceptor
} from '@react-motion-router/core';
import { cleanup } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Navigation, NavigationConfig } from '../../Navigation';
import { SECOND_TO_LAST_INDEX } from './common/constants';
import { GLOBAL_ENTRIES } from '../../common/constants';

describe('Navigation', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('resolves the previous entry', async () => {
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

    window.navigation.navigate('/hello', { history: 'replace' });
    window.navigation.navigate('/world/hello');
    
    expect(navigation.previous).toBeDefined();
    if (navigation.canGoBack())
      expect(navigation.previous.key)
        .toBe(GLOBAL_ENTRIES.at(SECOND_TO_LAST_INDEX)?.key);
  });

  it('resolves the next entry', async () => {
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

    window.navigation.navigate('/hello', { history: 'replace' });
    window.navigation.navigate('/world/hello');
    await window.navigation.back().finished;
    
    expect(navigation.next).toBeDefined();
    if (navigation.canGoForward())
      expect(navigation.next.key)
        .toBe(GLOBAL_ENTRIES.at(LAST_INDEX)?.key);
  });

  it('resolves the current entry', async () => {
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

    window.navigation.navigate('/hello', { history: 'replace' });
    window.navigation.navigate('/world/hello');
    
    expect(navigation.current).toBeDefined();
    expect(navigation.current.key).toBe(window.navigation.currentEntry?.key);
  });

  // TODO: need to test canGoBack and canGoForward when the target entry.sameDocument is false
  // Currently unsure how to create a non-sameDocument entry that has the same origin. It has
  // been a bug in the past however. When users unload the browser window by clicking the
  // actual browser reload button it used to cause traversal navigations to break because the assumption
  // at the time was that same document === same origin. This didn't seem like it was the case however.
});