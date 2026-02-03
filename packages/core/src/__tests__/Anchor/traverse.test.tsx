import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertNavigationAvailable,
  installInterceptor,
  navTo,
  seedHistory,
  traverseTo,
  traverseToStart,
  uninstallInterceptor,
  waitForNavigateSuccess
} from '../../common/test-utils';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Anchor } from '../../Anchor';
import { SECOND_INDEX } from './common/constants';
import { SINGLE_ELEMENT_LENGTH } from '../../common/constants';

describe('Anchor - traverse', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('defaults to prev when rel is undefined', async () => {
    await seedHistory();

    // At /three now
    const { getByText } = render(
      <Anchor traverse>
        Back
      </Anchor>
    );

    const a = getByText('Back') as HTMLAnchorElement;

    // Initial href should point at prev entry (/two) because href is computed when traverse+rel
    expect(a.getAttribute('href')?.endsWith('/two')).toBe(true);
  });

  it(
    'searches previous entries first when rel is undefined and href hint is present',
    async () => {
      await navTo('/one', 'replace');
      await navTo('/two');
      await navTo('/three');
      await navTo('/two', 'push');

      // At /three now
      const { getByText } = render(
        <Anchor href='/two' traverse>
        Back
        </Anchor>
      );

      await act(async () => {
        await window.navigation.back().finished;
      });
      const a = getByText('Back') as HTMLAnchorElement;

      expect(a.getAttribute('href')?.endsWith('/two')).toBe(true);
      await act(async () => {
        fireEvent.click(a);
        await waitForNavigateSuccess();
      });
      expect(window.navigation.currentEntry?.index).toBe(SECOND_INDEX);
    }
  );

  it(
    'searches next entries when rel is undefined and previous entries don\'t match href hint'
    , async () => {
      await navTo('/one', 'replace');
      await navTo('/three');
      await navTo('/two');

      // At /three now
      const { getByText } = render(
        <Anchor href='/two' traverse>
        Next
        </Anchor>
      );

      await act(async () => {
        await window.navigation.back().finished;
      });
      const a = getByText('Next') as HTMLAnchorElement;

      expect(a.getAttribute('href')?.endsWith('/two')).toBe(true);
      await act(async () => {
        fireEvent.click(a);
        await waitForNavigateSuccess();
      });
      const LAST_ENTRY_INDEX = window.navigation
        .entries().length - SINGLE_ELEMENT_LENGTH;
      expect(window.navigation.currentEntry?.index).toBe(LAST_ENTRY_INDEX);
    }
  );

  it(
    'yields no href when rel is undefined and no previous entry'
    , async () => {
      await navTo('/one', 'replace');
      await navTo('/two');

      // At /three now
      const { getByText } = render(
        <Anchor traverse>
        Disabled
        </Anchor>
      );

      await act(async () => {
        await window.navigation.back().finished;
      });
      const a = getByText('Disabled') as HTMLAnchorElement;

      expect(a.getAttribute('href')).toBe(null);
    }
  );

  it(
    'yields no href when rel is prev and no previous entry'
    , async () => {
      await navTo('/one', 'replace');
      await navTo('/two');

      // At /three now
      const { getByText } = render(
        <Anchor rel='prev' traverse>
        Disabled
        </Anchor>
      );

      await act(async () => {
        await window.navigation.back().finished;
      });
      const a = getByText('Disabled') as HTMLAnchorElement;

      expect(a.getAttribute('href')).toBe(null);
    }
  );

  it(
    'yields no href when rel is next and no next entry'
    , async () => {
      await navTo('/one', 'replace');
      await navTo('/two');

      // At /three now
      const { getByText } = render(
        <Anchor rel='next' traverse>
        Disabled
        </Anchor>
      );

      const a = getByText('Disabled') as HTMLAnchorElement;

      expect(a.getAttribute('href')).toBe(null);
    }
  );

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