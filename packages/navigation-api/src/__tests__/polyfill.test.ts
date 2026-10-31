import { describe, expect, it } from 'vitest';
import { getNavigationApi } from '../index';
import { NavigationFacade } from '../polyfill';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('NavigationFacade', () => {
  it('navigates and traverses its virtual entries', async () => {
    const navigation = new NavigationFacade({
      initialUrl: 'https://example.test/',
      storage: new MemoryStorage(),
    });

    await navigation.navigate('/first').finished;
    await navigation.navigate('/second').finished;

    expect(navigation.currentEntry.url).toBe('https://example.test/second');
    expect(navigation.entries().map(entry => entry.index)).toEqual([0, 1, 2]);
    expect(navigation.canGoBack).toBe(true);

    await navigation.back().finished;
    expect(navigation.currentEntry.url).toBe('https://example.test/first');

    await navigation.forward().finished;
    expect(navigation.currentEntry.url).toBe('https://example.test/second');
  });

  it('persists virtual entries and preserves entry identity within a facade', async () => {
    const storage = new MemoryStorage();
    const first = new NavigationFacade({
      initialUrl: 'https://example.test/',
      storage,
    });
    const initialEntry = first.currentEntry;

    await first.navigate('/saved', { state: { value: 42 } }).finished;

    expect(first.entries()[0]).toBe(initialEntry);

    const restored = new NavigationFacade({
      initialUrl: 'https://example.test/',
      storage,
    });
    expect(restored.currentEntry.url).toBe('https://example.test/saved');
    expect(restored.currentEntry.getState()).toEqual({ value: 42 });
  });

  it('does not commit a canceled navigation', async () => {
    const navigation = new NavigationFacade({
      initialUrl: 'https://example.test/',
      storage: new MemoryStorage(),
    });
    let navigationError: unknown;
    navigation.onnavigateerror = event => {
      navigationError = event.error;
    };
    navigation.addEventListener('navigate', event => event.preventDefault(), { once: true });

    const result = navigation.navigate('/canceled');
    await expect(result.committed).rejects.toMatchObject({ name: 'AbortError' });
    await expect(result.finished).rejects.toMatchObject({ name: 'AbortError' });

    expect(navigation.currentEntry.url).toBe('https://example.test/');
    expect(navigation.entries()).toHaveLength(1);
    expect(navigationError).toMatchObject({ name: 'AbortError' });
  });

  it('rejects virtual cross-origin navigation', () => {
    const navigation = new NavigationFacade({
      initialUrl: 'https://example.test/',
      storage: null,
    });

    expect(() => navigation.navigate('https://other.test/')).toThrow('same-origin');
  });

  it('reuses the lazily created fallback facade', async () => {
    const [first, second] = await Promise.all([
      getNavigationApi(),
      getNavigationApi(),
    ]);

    expect(first).toBe(second);
  });
});
