import { useEffect, useRef, useSyncExternalStore } from 'react';
import { LoadEvent } from './events';

const RERENDER_EVENT_TYPE = '--rerender';
export function useRerender() {
  return useSyncExternalStore(
    (callback) => {
      globalThis.addEventListener(
        RERENDER_EVENT_TYPE,
        callback,
        { once: true }
      );
      return () => {
        globalThis.removeEventListener(RERENDER_EVENT_TYPE, callback);
      };
    },
    () => document.timeline.currentTime
  );
}

export function useRerenderCallback<T extends () => unknown>(
  callback: T
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    const handler = callbackRef.current;
    globalThis.addEventListener(RERENDER_EVENT_TYPE, handler);

    return () => {
      globalThis.removeEventListener(RERENDER_EVENT_TYPE, handler);
    };
  });
}

export function triggerRerender() {
  globalThis.dispatchEvent(new Event(RERENDER_EVENT_TYPE));
}

export function createHistoryEntry(
  url: string,
  index: number
): NavigationHistoryEntry {
  return Object.create(EventTarget.prototype, {
    id: {
      value: crypto.randomUUID(),
      writable: false,
      enumerable: true,
      configurable: false,
    },
    key: {
      value: crypto.randomUUID(),
      writable: false,
      enumerable: true,
      configurable: false,
    },
    index: {
      value: index,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    url: {
      value: url,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    sameDocument: {
      value: true,
      writable: false,
      enumerable: true,
      configurable: false,
    },
    ondispose: {
      value: null,
      writable: true,
      enumerable: true,
      configurable: true,
    },
    getState: {
      value() {
        return undefined;
      },
      writable: false,
      enumerable: true,
      configurable: false,
    },
  });
}

export function assertNavigationAvailable() {
  if (!window.navigation) {
    throw new Error('window.navigation is not available in this environment');
  }
}

export function waitForNavigateSuccess() {
  return new Promise(resolve => {
    window.navigation.addEventListener(
      'navigatesuccess',
      resolve,
      { once: true }
    );
  });
}

export async function waitForNavigation(
  type: NavigateEvent['navigationType'] | LoadEvent['navigationType']
) {
  return new Promise(resolve => {
    window.navigation.addEventListener(
      'navigate',
      (e: NavigateEvent | LoadEvent) => {
        e.intercept({
          handler: () => {
            if (e.navigationType !== type)
              return Promise.resolve();
            if (e instanceof LoadEvent)
              e.transition.finished.then(resolve);
            else
              window.navigation.transition?.finished.then(resolve);
            return Promise.resolve();
          },
        });
      },
      { once: true }
    );
  });
}

export function navTo(
  url: string,
  history?: NavigationNavigateOptions['history']
) {
  return window.navigation.navigate(url, { history }).finished;
}

export async function traverseTo(key: string) {
  const res = window.navigation.traverseTo(key);
  await res.finished;
}

export async function traverseToStart() {
  const firstEntry = window.navigation.entries()[0];
  const res = window.navigation.traverseTo(firstEntry.key);
  await res.finished;
}

export async function seedHistory() {
  await navTo('/one');
  await navTo('/two');
  await navTo('/three');
}

const interceptor = (event: NavigateEvent) => {
  event.intercept({
    handler() {
      return Promise.resolve();
    },
  });
};
export async function installInterceptor() {
  window.navigation.addEventListener('navigate', interceptor);
}

export async function uninstallInterceptor() {
  window.navigation.removeEventListener('navigate', interceptor);
}