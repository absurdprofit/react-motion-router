import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { lazy } from '../common/utils';
import { Suspense } from 'react';

describe('lazy', () => {
  it('renders the lazy component after loading', async () => {
    const factory = vi.fn(async () => ({
      default: () => <div>Loaded</div>,
    }));

    const LazyComponent = lazy(factory);

    render(
      <Suspense fallback={<div>Loading</div>}>
        <LazyComponent />
      </Suspense>
    );

    // initial fallback
    expect(screen.getByText('Loading')).toBeDefined();

    // resolved render
    expect(await screen.findByText('Loaded')).toBeDefined();

    const MAX_CALLS = 1;
    // React.lazy calls the factory once
    expect(factory).toHaveBeenCalledTimes(MAX_CALLS);
  });

  it('preloads the module via load()', async () => {
    const factory = vi.fn(async () => ({
      default: () => <div>Loaded</div>,
    }));

    const LazyComponent = lazy(factory);

    const module = await LazyComponent.load();

    expect(module.default).toBeTypeOf('function');
    const MAX_CALLS = 1;
    expect(factory).toHaveBeenCalledTimes(MAX_CALLS);
  });

  it('does not refetch the module on subsequent load() calls', async () => {
    const factory = vi.fn(async () => ({
      default: () => <div>Loaded</div>,
    }));

    const LazyComponent = lazy(factory);

    await LazyComponent.load();
    await LazyComponent.load();

    const MAX_CALLS = 1;
    expect(factory).toHaveBeenCalledTimes(MAX_CALLS);
  });
});