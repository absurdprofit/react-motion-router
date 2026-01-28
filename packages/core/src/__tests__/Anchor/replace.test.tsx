import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertNavigationAvailable, installInterceptor, seedHistory, traverseToStart, uninstallInterceptor, waitForNavigateSuccess } from './common/utils';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Anchor } from '../../Anchor';

describe('Anchor - replace', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('replace: clicking updates current URL without growing history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    const { getByText } = render(
      <Anchor href="/login" replace>
        Logout
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('Logout'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(current?.url?.endsWith('/login')).toBe(true);
  });

  it('traverse takes precedence, but falls back to replace if no matching entry is found', async () => {
    await seedHistory();

    const startLen = window.navigation.entries().length;

    // No entry exists for /missing, so traverse fails -> replace should happen
    const { getByText } = render(
      <Anchor href="/missing" traverse replace>
        Missing
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('Missing'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    // replace fallback: history length should not grow
    expect(endLen).toBe(startLen);
    expect(current?.url?.endsWith('/missing')).toBe(true);
  });
});