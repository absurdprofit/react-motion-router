import { useEffect, useRef, useSyncExternalStore } from 'react';

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