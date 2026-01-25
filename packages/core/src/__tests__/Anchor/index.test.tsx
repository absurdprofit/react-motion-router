import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Anchor } from '../../Anchor';
import { assertNavigationAvailable, navTo, seedHistory, waitForNavigateSuccess } from './common/utils';


describe('Anchor', () => {
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    // Normalize to a known starting point without growing history too much.
    // Using replaceState keeps test deterministic; the Navigation API will still exist.
    globalThis.history.replaceState(null, '', `${location.pathname}/start`);
    await navTo('/start');
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
