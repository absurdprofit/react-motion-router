export class PromiseWrapper<T> {
	promise: Promise<T>;
	state: 'pending' | 'resolved' | 'rejected';
	nativeResolve: ((value: T | PromiseLike<T>) => void) | null;
	nativeReject: ((reason: any) => void) | null;
  constructor() {
    this.state = 'pending';
    this.nativeResolve = this.nativeReject = null;
    this.promise = new Promise((resolve, reject) => {
      this.nativeResolve = resolve;
      this.nativeReject = reject;
    });
  }
  resolve(value: T) {
    this.state = 'resolved';
    this.nativeResolve?.(value);
  }
  reject(reason: any) {
    this.state = 'rejected';
    // Do not report unhandled promise rejections.
    this.promise.catch(() => {});
    this.nativeReject?.(reason);
  }
}