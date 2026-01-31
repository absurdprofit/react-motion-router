import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertNavigationAvailable,
  installInterceptor,
  seedHistory,
  traverseToStart,
  uninstallInterceptor,
  waitForNavigateSuccess
} from '../../common/test-utils';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Anchor } from '../../Anchor';

describe('Anchor - reload', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    assertNavigationAvailable();
    cleanup();

    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

  it('reload: clicking keeps current URL and does not grow history', async () => {
    await seedHistory();
    const startLen = window.navigation.entries().length;
    const startUrl = window.navigation.currentEntry!.url;

    const { getByText } = render(<Anchor reload>Refresh</Anchor>);

    await act(async () => {
      fireEvent.click(getByText('Refresh'));
      await waitForNavigateSuccess();
    });

    const endLen = window.navigation.entries().length;
    const endUrl = window.navigation.currentEntry!.url;

    expect(endLen).toBe(startLen);
    expect(endUrl).toBe(startUrl);
  });
});