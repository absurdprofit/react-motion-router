export class PromiseWrapper<T> {
  public promise: Promise<T>;
  public state: 'pending' | 'resolved' | 'rejected';
  #nativeResolve: ((value: T | PromiseLike<T>) => void) | null;
  #nativeReject: ((reason: unknown) => void) | null;
  constructor() {
    this.state = 'pending';
    this.#nativeResolve = this.#nativeReject = null;
    this.promise = new Promise((resolve, reject) => {
      this.#nativeResolve = resolve;
      this.#nativeReject = reject;
    });
  }

  public resolve(value: T) {
    this.state = 'resolved';
    this.#nativeResolve?.(value);
  }

  public reject(reason: unknown) {
    this.state = 'rejected';
    // Do not report unhandled promise rejections.
    this.promise.catch(() => {});
    this.#nativeReject?.(reason);
  }
}