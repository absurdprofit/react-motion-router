import { beforeEach, describe, expect, it } from 'vitest';
import { assertNavigationAvailable, navTo, seedHistory, waitForNavigateSuccess } from './common/utils';
import { cleanup, fireEvent, render } from '@testing-library/react';
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

  it('reload: clicking keeps current URL and does not grow history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;
    const startUrl = window.navigation.currentEntry!.url;

    const { getByText } = render(<Anchor reload>Refresh</Anchor>);

    fireEvent.click(getByText('Refresh'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const endUrl = window.navigation.currentEntry!.url;

    expect(endLen).toBe(startLen);
    expect(endUrl).toBe(startUrl);
  });
});