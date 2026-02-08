import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Router } from '../../Router';
import { Screen } from '../../Screen';
import { FIRST_INDEX, navTo, traverseToStart } from '@react-motion-router/core';

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
    await act(async () => {
      return render(
        <Router id='router' config={{ basePath: globalThis.location.pathname }}>
          <Screen
            path='.'
            component={() => null}
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
      await navTo('modal');
    });

    const dialog = document.querySelector('#router-screen');

    expect(dialog).toBeInstanceOf(HTMLDialogElement);
    (dialog as HTMLDialogElement).requestClose();
    expect(window.navigation.currentEntry?.index).toBe(FIRST_INDEX);
  });
});