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
            name='keepalive'
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
      const keepAlive = document.querySelector('#router-keepalive');
      expect(dialog).toBeInstanceOf(HTMLDialogElement);
      // keeps previous screen alive
      expect(keepAlive).toBeInstanceOf(HTMLDivElement);
      expect(window.navigation.currentEntry?.index)
        .toBe(SECOND_INDEX);
    });

    await act(async () => {
      document.querySelector<HTMLDialogElement>('#router-screen')
        ?.requestClose();
    });

    await waitFor(async () => {
      await window.navigation.transition?.finished;
      expect(window.navigation.currentEntry?.index)
        .toBe(FIRST_INDEX);
    });
  });

  it.todo('closes the modal on exit', async () => {
    await navTo('/', 'push');
    const { getByText } = await act(async () => {
      return render(
        <Router id='router' config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='.'
            name='keepalive'
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
      const keepAlive = document.querySelector('#router-keepalive');
      expect(dialog).toBeInstanceOf(HTMLDialogElement);
      // keeps previous screen alive
      expect(keepAlive).toBeInstanceOf(HTMLDivElement);
      expect(window.navigation.currentEntry?.index)
        .toBe(THIRD_INDEX);
    });

    const dialog = document.querySelector<HTMLDialogElement>('#router-screen');
    const router = document.querySelector<HTMLElement>('#router');
    const onBack = vi.fn();
    const onClose = vi.fn();
    const removeBackEventListener = addEventListener(router, 'back', onBack);
    dialog?.addEventListener('close', onClose, { once: true });
    await act(async () => {
      window.navigation.back();
    });
    
    await waitFor(async () => {
      expect(router).toBeDefined();
      expect(dialog).toBeDefined();
      // assert that no other back navigation was triggered by the Screen.onExited lifecycle method,
      // which also calls dialog.close().
      expect(window.navigation.currentEntry?.index)
        .toBe(SECOND_INDEX);
      expect(onBack).not.toHaveBeenCalled();
    });
    expect(onClose).toHaveBeenCalled();

    removeBackEventListener();
  });

  // TODO: add test case for layered modals, where the second modal is rendered on top of the first modal, and both modals are on top of the first screen.
});