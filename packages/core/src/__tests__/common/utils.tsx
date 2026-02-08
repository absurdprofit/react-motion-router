import React, { createRef } from 'react';
import { NavigationBase } from '../../NavigationBase';
import { RouterBase, RouterBaseProps } from '../../RouterBase';
import { NestedRouterContext } from '../../RouterContext';
import { ScreenBase } from '../../ScreenBase';
import { cloneAndInject } from '../../common/utils';

export class TestNavigation extends NavigationBase {}

export class TestRouter extends RouterBase {
  protected ref = createRef<HTMLDivElement>();
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

  public state = {
    screens: [] as RouterBase['screens'],
  };

  constructor(
    props: RouterBaseProps,
    context: React.ContextType<typeof NestedRouterContext>
  ) {
    super(props, context);
    this.state = {
      screens: React.Children.map(props.children, (child, index) => {
        return cloneAndInject(child, {
          path: index.toString(),
        });
      }),
    };
  }

  protected canIntercept(): boolean {
    return true;
  }

  protected shouldIntercept(): boolean {
    return true;
  }

  protected get screens() {
    return this.state.screens;
  }

  protected intercept(e: NavigateEvent): void {
    e.intercept({
      handler() {
        return Promise.resolve();
      }, 
    });
  }

  public render() {
    return (
      <div ref={this.ref}>
        {super.render()}
      </div>
    );
  }
}

export class TestScreen extends ScreenBase {
  protected ref = createRef<HTMLDivElement>();

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

  public get viewTransitionName() {
    return `${this.context.id}-${this.name}`;
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

  public render() {
    return (
      <div ref={this.ref}>
        {super.render()}
      </div>
    );
  }
}