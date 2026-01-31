import { describe, expect, it, vi } from 'vitest';
import { TestRouter, TestScreen } from './common/utils';
import { lazy } from '../common/utils';

describe('Screen', () => {
  it('has a name with URL unsafe characters filtered out or replaced', () => {
    const router = new TestRouter(
      {
        children: [],
      },
      null
    );
    const screen = new TestScreen(
      {
        component: () => <div>Test</div>,
        path: '.',
        name: '-Test/Screen-=',
      },
      router
    );

    expect(screen.name).toBe('test-screen');
  });

  it('defaults to lowercase component name', async () => {
    const router = new TestRouter(
      {
        children: [],
      },
      null
    );
    function TestComponent() {
      return <div>Test</div>;
    }
    const screen1 = new TestScreen(
      {
        component: TestComponent,
        path: '.',
      },
      router
    );
    const LazyTestComponent = lazy(
      () => Promise.resolve({ default: TestComponent })
    );
    const screen2 = new TestScreen(
      {
        component: LazyTestComponent,
        path: '.',
      },
      router
    );
    await LazyTestComponent.load();

    expect(screen1.name).toBe('testcomponent');
    expect(screen2.name).toBe('testcomponent');
  });

  it('loads lazy component when load is called', async () => {
    const router = new TestRouter(
      {
        children: [],
      },
      null
    );
    function TestComponent() {
      return <div>Test</div>;
    }
 
    const LazyTestComponent = lazy(
      () => Promise.resolve({ default: TestComponent })
    );
    const screen = new TestScreen(
      {
        component: LazyTestComponent,
        path: '.',
      },
      router
    );
    screen.context = router;
    await screen.load(new AbortController().signal);

    expect(LazyTestComponent.module?.default).toBeDefined();
  });

  it('calls config.onLoad when load is called', async () => {
    const router = new TestRouter(
      {
        children: [],
      },
      null
    );
    function TestComponent() {
      return <div>Test</div>;
    }
 
    const onLoad = vi.fn();
    const LazyTestComponent = lazy(
      () => Promise.resolve({ default: TestComponent })
    );
    const screen = new TestScreen(
      {
        component: LazyTestComponent,
        path: '.',
        config: {
          onLoad,
        },
      },
      router
    );
    screen.context = router;
    await screen.load(new AbortController().signal);

    expect(onLoad).toBeCalled();
  });
});