import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Router } from '../../Router';
import { Screen } from '../../Screen';
import {
  FIRST_INDEX,
  traverseToStart,
  waitForNavigation
} from '@react-motion-router/core';
import { userEvent } from 'vitest/browser';
describe('Screen (modal)', () => {
  beforeEach(async () => {

    await traverseToStart();
  });

  it('renders using the dialog element', async () => {
    await act(async () => {
      return render(
        <Router id='router'>
          <Screen
            path='*'
            name='screen'
            component={() => null}
            config={{
              presentation: 'dialog',
            }}
          />
        </Router>
      );
    });

    const dialog = document.querySelector('#router-screen');

    expect(dialog).toBeInstanceOf(HTMLDialogElement);
  });

  it('renders a backdrop', async () => {
    await act(async () => {
      return render(
        <Router id='router'>
          <Screen
            path='*'
            name='screen'
            component={() => null}
            config={{
              presentation: 'modal',
            }}
          />
        </Router>
      );
    });

    const dialog = document.querySelector('#router-screen');

    expect(dialog).toBeInstanceOf(HTMLDialogElement);
    expect(dialog?.matches(':modal')).toBe(true);
  });

  it('navigates back on HTMLDialogElement.requestClose', async () => {
    const forLoad = waitForNavigation('load');
    const { getByText } = await act(async () => {
      return render(
        <Router id='router' config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='.'
            component={() => <a href='modal'>Modal</a>}
          />
          <Screen
            path='modal'
            name='screen'
            component={() => null}
            config={{
              presentation: 'modal',
            }}
          />
        </Router>
      );
    });
    
    await act(async () => {
      await forLoad;
      await userEvent.click(getByText('Modal'));
    });

    const dialog = document.querySelector('#router-screen');

    expect(dialog).toBeInstanceOf(HTMLDialogElement);

    
    await act(async () => {
      (dialog as HTMLDialogElement).requestClose();
    });
    await waitFor(async () => {
      expect(window.navigation.currentEntry?.index).toBe(FIRST_INDEX);
    });
  });
});