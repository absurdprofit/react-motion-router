import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertNavigationAvailable, installInterceptor, navTo, seedHistory, uninstallInterceptor, waitForNavigateSuccess } from './common/utils';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Anchor } from '../../Anchor';

describe('Anchor - push', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    // Normalize to a known starting point without growing history too much.
    // Using replaceState keeps test deterministic; the Navigation API will still exist.
    globalThis.history.replaceState(null, '', `${location.pathname}/start`);
    await navTo('/start');
  });
  afterAll(uninstallInterceptor);

  it('default (push): clicking adds a new entry and updates current URL', async () => {
    const startLen = window.navigation.entries().length;

    const { getByText } = render(<Anchor href="/posts">Posts</Anchor>);
    await act(async () => {
      fireEvent.click(getByText('Posts'));
      await waitForNavigateSuccess();
    });


    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBeGreaterThan(startLen);
    expect(current?.url?.endsWith('/posts')).toBe(true);
  });

  it('push fallback when traverse is untenable and no replace/reload is set', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    // traverse fails -> should push (adds a new entry)
    const { getByText } = render(
      <Anchor href="/new-tab" traverse>
        New Tab
      </Anchor>
    );

    await act(async () => {
      fireEvent.click(getByText('New Tab'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBeGreaterThan(startLen);
    expect(current?.url?.endsWith('/new-tab')).toBe(true);
  });
});