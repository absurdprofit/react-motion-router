import { beforeEach, describe, expect, it } from 'vitest';
import { assertNavigationAvailable, navTo, seedHistory, traverseTo, waitForNavigateSuccess } from './common/utils';
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

  it('traverse rel="prev": moves to the previous existing entry without growing history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    // Current is /three, prev should go to /two
    const { getByText } = render(
      <Anchor traverse rel="prev">
        Back
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('Back'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(current?.url?.endsWith('/two')).toBe(true);
  });

  it('traverse rel="next": moves to the next existing entry without growing history', async () => {
    await seedHistory();

    // Go back to /two first, then test next -> /three
    const entryTwo = window.navigation.entries().find(e => e.url?.endsWith('/two'));
    expect(entryTwo).toBeTruthy();
    await act(traverseTo(entryTwo!.key));

    const startLen = window.navigation.entries().length;

    const { getByText } = render(
      <Anchor traverse rel="next">
        Forward
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('Forward'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(current?.url?.endsWith('/three')).toBe(true);
  });

  it('traverse with href hint: navigates to closest matching entry without growing history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    // Current is /three, target is an existing entry /one
    const { getByText } = render(
      <Anchor href="/one" traverse>
        Tab 1
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('Tab 1'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(current?.url?.endsWith('/one')).toBe(true);
  });

  it('traverse with historyEntryKey: goes to the exact entry key when it exists', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    const target = window.navigation.entries().find(e => e.url?.endsWith('/one'));
    expect(target).toBeTruthy();

    const { getByText } = render(
      <Anchor traverse historyEntryKey={target!.key}>
        Jump
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('Jump'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(current!.key).toBe(target!.key);
    expect(current?.url?.endsWith('/one')).toBe(true);
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