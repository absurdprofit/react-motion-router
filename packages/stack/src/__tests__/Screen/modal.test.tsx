import { act, render, waitFor } from '@testing-library/react';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';
import { Router } from '../../Router';
import { Screen } from '../../Screen';
import {
  FIRST_INDEX,
  installInterceptor,
  navTo,
  traverseToStart,
  uninstallInterceptor
} from '@react-motion-router/core';
import { userEvent } from 'vitest/browser';
import { SECOND_INDEX, THIRD_INDEX } from '../Navigation/common/constants';
import { addEventListener } from '../../common/test-utils';

describe('Screen (modal)', () => {
  beforeAll(installInterceptor);
  beforeEach(async () => {
    await traverseToStart();
  });
  afterAll(uninstallInterceptor);

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

    await waitFor(async () => {
      await window.navigation.transition?.finished;
      expect(window.navigation.currentEntry?.index)
        .toBe(FIRST_INDEX);
    });
  });

  it('closes the modal on exit', async () => {
    await navTo('/', 'push');
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
        .toBe(THIRD_INDEX);
    });

    const dialog = document.querySelector<HTMLDialogElement>('#router-screen');
    const router = document.querySelector<HTMLElement>('#router');
    const onBack = vi.fn();
    const onClose = vi.fn();
    const removeBackEventListener = addEventListener(router, 'back', onBack);
    dialog?.addEventListener('close', onClose, { once: true });
    window.navigation.back();
    
    await waitFor(() => {
      expect(router).toBeDefined();
      expect(dialog).toBeDefined();
      expect(onClose).toHaveBeenCalled();
      // assert that no other back navigation was triggered by the Screen.onExited lifecycle method,
      // which also calls dialog.close().
      expect(window.navigation.currentEntry?.index)
        .toBe(SECOND_INDEX);
      expect(onBack).not.toHaveBeenCalled();
    });

    removeBackEventListener();
    // TODO: fix the previous test case navigation state from leaking into this one. Currently at the start of this tes case window.navigation.transition is not null.
  });
});