import { describe } from 'vitest';
import { NavigationBase } from '../NavigationBase';
import { RouterBase } from '../RouterBase';

class TestNavigation extends NavigationBase {}

class TestRouter extends RouterBase {
  public navigation = new TestNavigation({
    addEventListener: this.addEventListener.bind(this),
    removeEventListener: this.removeEventListener.bind(this),
    dispatchEvent: this.dispatchEvent.bind(this),
    parent: this.parent?.navigation ?? null,
    routerId: this.id,
    baseURL: this.baseURL,
    baseURLPattern: this.baseURLPattern,
    getNavigatorById: (id: string) =>
      this.getRouterById(id)?.navigation ?? null,
  });

  protected canIntercept(): boolean {
    return true;
  }

  protected shouldIntercept(): boolean {
    return true;
  }

  protected get screens() {
    return this.props.children;
  }

  protected intercept(e: NavigateEvent): void {
    e.intercept({
      handler() {
        return Promise.resolve();
      }, 
    });
  }
}

describe('RouterBase', () => {
  
});