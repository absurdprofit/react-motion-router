export function addEventListener<T extends EventTarget>(
  target: T | null,
  ...args: Parameters<T['addEventListener']>
) {
  if (!target) return () => {};

  const [type, listener, options] = args;
  target.addEventListener(type, listener, options);

  return () => {
    target.removeEventListener(type, listener, options);
  };
}