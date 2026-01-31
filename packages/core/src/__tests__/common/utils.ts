import { NavigationBase } from '../../NavigationBase';
import { RouterBase } from '../../RouterBase';
import { ScreenBase } from '../../ScreenBase';

export class TestNavigation extends NavigationBase {}

export class TestRouter extends RouterBase {
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

export class TestScreen extends ScreenBase {
  public get id(): string {
    return this.props.path ?? '';
  }

  public get params() {
    return this.props.defaultParams ?? {};
  }

  public get config() {
    return this.props.config ?? {};
  }

  public get resolvedPathname(): string {
    return this.path;
  }

  protected get routeProp() {
    return {
      config: this.config,
      params: this.params,
      focused: false,
      path: this.path,
      resolvedPathname: this.resolvedPathname,
      setConfig() {
          
      },
      setParams() {
      },
    };
  }
}