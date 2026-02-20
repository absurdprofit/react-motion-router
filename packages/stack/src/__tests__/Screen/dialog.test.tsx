import { act, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Router } from '../../Router';
import { Screen } from '../../Screen';
import { userEvent } from 'vitest/browser';
import { SECOND_INDEX } from '../Navigation/common/constants';
import { FIRST_INDEX } from '@react-motion-router/core';

describe('Screen (dialog)', () => {
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

  it('does not render a backdrop', async () => {
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
    expect(dialog?.matches(':modal')).toBe(false);
  });

  it.todo('navigates back on click outside', async () => {
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
              presentation: 'dialog',
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
      await userEvent.click(getByText('Modal'));
    });

    await waitFor(async () => {
      await window.navigation.transition?.finished;
      expect(window.navigation.currentEntry?.index)
        .toBe(FIRST_INDEX);
    });
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
              presentation: 'dialog',
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
});