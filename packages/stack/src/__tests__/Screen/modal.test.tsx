import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Router } from '../../Router';
import { Screen } from '../../Screen';
import {
  FIRST_INDEX,
  traverseToStart
} from '@react-motion-router/core';
import { userEvent } from 'vitest/browser';
import { SECOND_INDEX } from '../Navigation/common/constants';
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
      await userEvent.click(getByText('Modal'));
    });
    
    await waitFor(() => {
      const dialog = document.querySelector('#router-screen');
      expect(dialog).toBeInstanceOf(HTMLDialogElement);
      expect(window.navigation.currentEntry?.index)
        .toBe(SECOND_INDEX);
    });

    document.querySelector<HTMLDialogElement>('#router-screen')
      ?.requestClose();

    await waitFor(() => {
      expect(window.navigation.currentEntry?.index)
        .toBe(FIRST_INDEX);
    });
  });

  it('closes the modal on exit', async () => {
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
      await userEvent.click(getByText('Modal'));
    });
    
    await waitFor(() => {
      const dialog = document.querySelector('#router-screen');
      expect(dialog).toBeInstanceOf(HTMLDialogElement);
      expect(window.navigation.currentEntry?.index)
        .toBe(SECOND_INDEX);
    });

    const dialog = document.querySelector<HTMLDialogElement>('#router-screen');
    window.navigation.back();
    
    await waitFor(() => {
      const onClose = vi.fn();
      dialog?.addEventListener('close', onClose, { once: true });
      expect(window.navigation.currentEntry?.index)
        .toBe(FIRST_INDEX);
      expect(onClose).toHaveBeenCalled();
    });

    // TODO: add an assertion that ensures navigation.goBack() was not called. We need to ensure the dialog's close handler doesn't get triggered by the onExit lifecycle method, which also calls dialog.close().
  });
});