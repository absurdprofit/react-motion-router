import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertNavigationAvailable,
  installInterceptor,
  seedHistory,
  traverseTo,
  traverseToStart,
  uninstallInterceptor,
  waitForNavigateSuccess
} from '../../common/test-utils';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Anchor } from '../../Anchor';

describe('Anchor - traverse', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it(
    'traverse without hints moves to the previous existing entry without growing history',
    async () => {
      await seedHistory();
      const startLen = window.navigation.entries().length;

      // Current is /three, prev should go to /two
      const { getByText } = render(
        <Anchor traverse>
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
    }
  );

  it(
    'traverse rel="prev": moves to the previous existing entry without growing history',
    async () => {
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
    }
  );

  it(
    'traverse rel="next": moves to the next existing entry without growing history',
    async () => {
      await seedHistory();

      // Go back to /two first, then test next -> /three
      const entryTwo = window.navigation
        .entries()
        .find(e => e.url?.endsWith('/two'));
      expect(entryTwo).toBeTruthy();
      await act(() => traverseTo(entryTwo!.key));

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
    }
  );

  it('traverse uses last keyword in rel as hint', async () => {
    await seedHistory();

    // Go back to /two first, then test next -> /three
    const entryTwo = window.navigation
      .entries()
      .find(e => e.url?.endsWith('/two'));
    expect(entryTwo).toBeTruthy();
    await act(() => traverseTo(entryTwo!.key));

    const startLen = window.navigation.entries().length;

    const { getByText } = render(
      <Anchor traverse rel="prev me next about">
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

  it(
    'traverse with href hint: navigates to closest matching entry without growing history',
    async () => {
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
    }
  );

  it(
    'traverse with historyEntryKey: goes to the exact entry key when it exists',
    async () => {
      await seedHistory();
      const startLen = window.navigation.entries().length;

      const target = window.navigation
        .entries()
        .find(e => e.url?.endsWith('/one'));
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
    }
  );
});