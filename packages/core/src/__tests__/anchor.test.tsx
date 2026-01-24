import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Anchor } from '../Anchor';

function assertNavigationAvailable() {
  // per your constraint: assume it exists. If it doesn't, fail hard.
  if (!window.navigation) {
    throw new Error('window.navigation is not available in this environment');
  }
}

function pathHash(url?: string | null) {
  if (!url) return '';
  const u = new URL(url);
  return `${u.pathname}${u.hash}`;
}

async function waitForNavigateSuccess() {
  await window.navigation.transition?.finished;
}

async function navTo(url: string) {
  const res = window.navigation.navigate(url);
  // Chromium Navigation API: navigate() returns { committed, finished }
  await res.finished;
}

async function traverseTo(key: string) {
  const res = window.navigation.traverseTo(key);
  await res.finished;
}

async function seedHistory() {
  // Use hash navigations to avoid fetching any real routes.
  await navTo('/one');
  await navTo('/two');
  await navTo('/three');
}

describe('Anchor', () => {
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    // Normalize to a known starting point without growing history too much.
    // Using replaceState keeps test deterministic; the Navigation API will still exist.
    window.history.replaceState(null, '', `${location.pathname}/start`);
    await navTo('/start');
  });

  it('default (push): clicking adds a new entry and updates current URL', async () => {
    const startLen = window.navigation.entries().length;

    const { getByText } = render(<Anchor href="/posts">Posts</Anchor>);
    fireEvent.click(getByText('Posts'));

    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBeGreaterThan(startLen);
    expect(pathHash(current?.url)).toBe(`${location.pathname}/posts`);
  });

  it('replace: clicking updates current URL without growing history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    const { getByText } = render(
      <Anchor href="/login" replace>
        Logout
      </Anchor>
    );

    fireEvent.click(getByText('Logout'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/login`);
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

  it('traverse rel="prev": moves to the previous existing entry without growing history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    // Current is /three, prev should go to /two
    const { getByText } = render(
      <Anchor traverse rel="prev">
        Back
      </Anchor>
    );

    fireEvent.click(getByText('Back'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/two`);
  });

  it('traverse rel="next": moves to the next existing entry without growing history', async () => {
    await seedHistory();

    // Go back to /two first, then test next -> /three
    const entryTwo = window.navigation.entries().find(e => pathHash(e.url) === `${location.pathname}/two`);
    expect(entryTwo).toBeTruthy();
    await traverseTo(entryTwo!.key);

    const startLen = window.navigation.entries().length;

    const { getByText } = render(
      <Anchor traverse rel="next">
        Forward
      </Anchor>
    );

    fireEvent.click(getByText('Forward'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/three`);
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

    fireEvent.click(getByText('Tab 1'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/one`);
  });

  it('traverse with historyEntryKey: goes to the exact entry key when it exists', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    const target = window.navigation.entries().find(e => pathHash(e.url) === `${location.pathname}/one`);
    expect(target).toBeTruthy();

    const { getByText } = render(
      <Anchor traverse historyEntryKey={target!.key}>
        Jump
      </Anchor>
    );

    fireEvent.click(getByText('Jump'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBe(startLen);
    expect(current!.key).toBe(target!.key);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/one`);
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

    fireEvent.click(getByText('Missing'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    // replace fallback: history length should not grow
    expect(endLen).toBe(startLen);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/missing`);
  });

  it('push fallback when traverse fails and no replace/reload is set', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;

    // traverse fails -> should push (adds a new entry)
    const { getByText } = render(
      <Anchor href="/new-tab" traverse>
        New Tab
      </Anchor>
    );

    fireEvent.click(getByText('New Tab'));
    await waitForNavigateSuccess();

    const endLen = window.navigation.entries().length;
    const current = window.navigation.currentEntry;

    expect(endLen).toBeGreaterThan(startLen);
    expect(pathHash(current!.url)).toBe(`${location.pathname}/new-tab`);
  });

  it('component reacts to navigatesuccess by updating its rendered href', async () => {
    await seedHistory();

    // At /three now
    const { getByText } = render(
      <Anchor traverse rel="prev">
        Back
      </Anchor>
    );

    const a = getByText('Back') as HTMLAnchorElement;

    // Initial href should point at prev entry (/two) because href is computed when traverse+rel
    expect(a.getAttribute('href')).toBe('/two');

    fireEvent.click(a);
    await waitForNavigateSuccess();

    // After navigating to /two, the component's computed href should now point at /one
    expect((getByText('Back') as HTMLAnchorElement).getAttribute('href')).toBe('/one');
  });
});
