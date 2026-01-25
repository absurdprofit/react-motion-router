import { beforeEach, describe, expect, it } from 'vitest';
import { assertNavigationAvailable, navTo, seedHistory, waitForNavigateSuccess } from './common/utils';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Anchor } from '../../Anchor';

describe('Anchor - push', () => {
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    // Normalize to a known starting point without growing history too much.
    // Using replaceState keeps test deterministic; the Navigation API will still exist.
    globalThis.history.replaceState(null, '', `${location.pathname}/start`);
    await navTo('/start');
  });

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
});