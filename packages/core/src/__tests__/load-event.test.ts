import { describe, expect, it, vi } from 'vitest';
import { LoadEvent } from '../common/events';
import { FIRST_INDEX, LAST_INDEX } from '../common/constants';

describe('LoadEvent', () => {
  it('creates a transition on first intercept()', async () => {
    const e = new LoadEvent();

    e.intercept({
      handler: () => Promise.resolve(),
    });

    const t = e.transition;
    expect(t?.navigationType).toBe('load');
    expect(t?.from).toBe(window.navigation.currentEntry);
  });

  it(
    'resolves transition.finished after handler promise resolves',
    async () => {
      let resolve!: () => void;

      const e = new LoadEvent();

      e.intercept({
        handler: () =>
          new Promise<void>((r) => {
            resolve = r;
          }),
      });

      let finished = false;
      e.transition?.finished.then(() => (finished = true));

      expect(finished).toBe(false);

      resolve();
      await e.transition?.finished;

      expect(finished).toBe(true);
    }
  );

  it('awaits all intercept handlers before transition.finished', async () => {
    const e = new LoadEvent();
    const order = new Array<string>();
    const firstPromise = Promise.withResolvers<void>();
    const secondPromise = Promise.withResolvers<void>();

    e.intercept({
      handler: async () => {
        await firstPromise.promise;
        order.push('firstPromise');
      },
    });

    e.intercept({
      handler: async () => {
        await secondPromise.promise;
        order.push('secondPromise');
      },
    });

    queueMicrotask(() => {
      firstPromise.resolve();
      secondPromise.resolve();
    });

    await e.transition?.finished;
    order.push('finished');
    expect(order).toStrictEqual([
      'firstPromise',
      'secondPromise',
      'finished',
    ]);
  });

  it('throws if intercept() is called after transition.finished', async () => {
    const e = new LoadEvent();

    e.intercept({ handler: () => Promise.resolve() });

    await e.transition?.finished;

    expect(() => e.intercept()).toThrow(DOMException);
  });

  it('aborts when a different navigate event is dispatched', () => {
    const e = new LoadEvent();

    expect(e.signal.aborted).toBe(false);

    const other = new Event('navigate');
    window.navigation.dispatchEvent(other);

    expect(e.signal.aborted).toBe(true);
  });

  it('removes listener when self-dispatched with no intercepts', () => {
    const e = new LoadEvent();
    const mockRemoveEventListener = vi.spyOn(
      window.navigation,
      'removeEventListener'
    );

    window.navigation.dispatchEvent(e);

    expect(window.navigation.removeEventListener).toHaveBeenCalled();
    expect(
      mockRemoveEventListener.mock
        .calls
        .at(LAST_INDEX)
        ?.at(FIRST_INDEX)
    ).toBe('navigate');

    mockRemoveEventListener.mockRestore();
  });
});