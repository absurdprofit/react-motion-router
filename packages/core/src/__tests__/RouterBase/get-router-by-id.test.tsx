import { describe, expect, it } from 'vitest';
import { TestRouter, TestScreen } from '../common/utils';

describe('Router.getRouterById', () => {
  it('finds the correct router by its ID', () => {
    const parentRouter = new TestRouter(
      {
        children: [],
      },
      null
    );
    parentRouter.componentDidMount();
    const parentScreen = new TestScreen(
      {
        component: () => <div>Test</div>,
        path: '.',
      },
      parentRouter
    );

    const childRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      {
        parentRouter,
        parentScreen,
      }
    );
    childRouter.componentDidMount();

    expect(parentRouter.getRouterById('test-id')).toBe(childRouter);
    childRouter.componentWillUnmount();
    parentRouter.componentWillUnmount();
  });

  it('fails with null as return value', () => {
    const parentRouter = new TestRouter(
      {
        children: [],
      },
      null
    );
    parentRouter.componentDidMount();

    expect(parentRouter.getRouterById('test-id')).toBe(null);
    parentRouter.componentWillUnmount();
  });

  it('returns itself if the ID matches', () => {
    const parentRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      null
    );
    parentRouter.componentDidMount();

    expect(parentRouter.getRouterById('test-id')).toBe(parentRouter);
    parentRouter.componentWillUnmount();
  });

  it('finds the first match', () => {
    const parentRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      null
    );
    parentRouter.componentDidMount();
    const parentScreen = new TestScreen(
      {
        component: () => <div>Test</div>,
        path: '.',
      },
      parentRouter
    );

    const childRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      {
        parentRouter,
        parentScreen,
      }
    );
    childRouter.componentDidMount();

    expect(parentRouter.getRouterById('test-id')).toBe(parentRouter);
    childRouter.componentWillUnmount();
    parentRouter.componentWillUnmount();
  });

  it('starts searching from the root by default', () => {
    const parentRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      null
    );
    parentRouter.componentDidMount();
    const parentScreen = new TestScreen(
      {
        component: () => <div>Test</div>,
        path: '.',
      },
      parentRouter
    );

    const childRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      {
        parentRouter,
        parentScreen,
      }
    );
    childRouter.componentDidMount();

    expect(childRouter.getRouterById('test-id')).toBe(parentRouter);

    childRouter.componentWillUnmount();
    parentRouter.componentWillUnmount();
  });

  it('can start searching from a router other than root', () => {
    const parentRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      null
    );
    parentRouter.componentDidMount();
    const parentScreen = new TestScreen(
      {
        component: () => <div>Test</div>,
        path: '.',
      },
      parentRouter
    );

    const childRouter = new TestRouter(
      {
        children: [],
        id: 'test-id',
      },
      {
        parentRouter,
        parentScreen,
      }
    );
    childRouter.componentDidMount();

    expect(childRouter.getRouterById('test-id', childRouter)).toBe(childRouter);

    childRouter.componentWillUnmount();
    parentRouter.componentWillUnmount();
  });
});