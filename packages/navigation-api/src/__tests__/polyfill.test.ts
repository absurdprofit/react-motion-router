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

class TestDocument {
  private readonly listeners = new Map<string, EventListener[]>();

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== listener));
  }

  querySelector(): null {
    return null;
  }

  get defaultView(): Window & typeof globalThis {
    return globalThis as Window & typeof globalThis;
  }

  dispatch(type: string, event: Event, target: object): void {
    Object.defineProperty(event, 'target', { configurable: true, value: target });
    for (const listener of this.listeners.get(type) ?? []) {
      listener.call(this, event);
    }
  }
}

class TestElement {
  closest(): TestElement {
    return this;
  }
}

class TestAnchor extends TestElement {
  readonly relList = { contains: () => false };
  readonly href: string;
  private readonly target: string | null;
  private readonly download: boolean;

  constructor(href: string, target: string | null = null, download = false) {
    super();
    this.href = href;
    this.target = target;
    this.download = download;
  }

  getAttribute(name: string): string | null {
    return name === 'target' ? this.target : name === 'href' ? this.href : null;
  }

  hasAttribute(name: string): boolean {
    return name === 'download' && this.download;
  }
}

class TestForm extends TestElement {
  readonly relList = { contains: () => false };
  readonly ownerDocument = globalThis.document;
  readonly method: string;
  readonly action: string;
  readonly fields: Array<[string, string]>;
  nativeSubmitCalled = false;

  constructor(action: string, method: string, fields: Array<[string, string]>) {
    super();
    this.action = action;
    this.method = method;
    this.fields = fields;
  }

  getAttribute(name: string): string | null {
    return name === 'action' ? this.action : null;
  }

  submit(): void {
    this.nativeSubmitCalled = true;
  }
}

async function withDocument<T>(document: TestDocument, callback: () => Promise<T>): Promise<T> {
  const global = globalThis as typeof globalThis & Record<string, unknown>;
  const names = [
    'document',
    'window',
    'Element',
    'HTMLAnchorElement',
    'HTMLFormElement',
    'HTMLButtonElement',
    'HTMLInputElement',
    'FormData',
  ];
  const previous = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(global, name)]));
  const NativeFormData = globalThis.FormData;

  class TestFormData extends NativeFormData {
    constructor(form?: HTMLFormElement) {
      super();
      const fields = (form as unknown as TestForm | undefined)?.fields ?? [];
      for (const [name, value] of fields) {
        this.append(name, value);
      }
    }
  }

  Object.defineProperties(global, {
    document: { configurable: true, value: document },
    window: { configurable: true, value: document },
    Element: { configurable: true, value: TestElement },
    HTMLAnchorElement: { configurable: true, value: TestAnchor },
    HTMLFormElement: { configurable: true, value: TestForm },
    HTMLButtonElement: { configurable: true, value: class TestButton extends TestElement {} },
    HTMLInputElement: { configurable: true, value: class TestInput extends TestElement {} },
    FormData: { configurable: true, value: TestFormData },
  });

  try {
    return await callback();
  } finally {
    for (const [name, descriptor] of previous) {
      if (descriptor) {
        Object.defineProperty(global, name, descriptor);
      } else {
        Reflect.deleteProperty(global, name);
      }
    }
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

  it('intercepts same-origin link clicks as user-initiated navigations', async () => {
    const document = new TestDocument();
    await withDocument(document, async () => {
      const navigation = new NavigationFacade({
        initialUrl: 'https://example.test/',
        storage: null,
      });
      let navigateEvent: Event | undefined;
      navigation.addEventListener('navigate', event => {
        navigateEvent = event;
      });

      const click = new Event('click', { cancelable: true }) as MouseEvent;
      Object.defineProperties(click, {
        button: { value: 0 },
        metaKey: { value: false },
        ctrlKey: { value: false },
        shiftKey: { value: false },
        altKey: { value: false },
        isTrusted: { value: true },
      });
      document.dispatch('click', click, new TestAnchor('https://example.test/details'));
      await navigation.transition?.finished;

      expect(click.defaultPrevented).toBe(true);
      expect(navigation.currentEntry.url).toBe('https://example.test/details');
      expect(navigateEvent).toMatchObject({
        userInitiated: true,
        formData: null,
        sourceElement: expect.any(TestAnchor),
      });
      expect(navigation.currentEntry.sameDocument).toBe(false);
      navigation.dispose();
    });
  });

  it('leaves cross-origin, targeted, download, and modified link clicks native', async () => {
    const document = new TestDocument();
    await withDocument(document, async () => {
      const navigation = new NavigationFacade({
        initialUrl: 'https://example.test/',
        storage: null,
      });
      const cases = [
        new TestAnchor('https://other.test/'),
        new TestAnchor('https://example.test/new-tab', '_blank'),
        new TestAnchor('https://example.test/download', null, true),
      ];

      for (const anchor of cases) {
        const click = new Event('click', { cancelable: true }) as MouseEvent;
        Object.defineProperties(click, {
          button: { value: 0 },
          metaKey: { value: false },
          ctrlKey: { value: false },
          shiftKey: { value: false },
          altKey: { value: false },
        });
        document.dispatch('click', click, anchor);
        expect(click.defaultPrevented).toBe(false);
      }

      const modifiedClick = new Event('click', { cancelable: true }) as MouseEvent;
      Object.defineProperties(modifiedClick, {
        button: { value: 0 },
        metaKey: { value: false },
        ctrlKey: { value: true },
        shiftKey: { value: false },
        altKey: { value: false },
      });
      document.dispatch(
        'click',
        modifiedClick,
        new TestAnchor('https://example.test/modified')
      );

      expect(modifiedClick.defaultPrevented).toBe(false);
      expect(navigation.currentEntry.url).toBe('https://example.test/');
      navigation.dispose();
    });
  });

  it('intercepts same-origin GET form submissions and exposes their form data', async () => {
    const document = new TestDocument();
    await withDocument(document, async () => {
      const navigation = new NavigationFacade({
        initialUrl: 'https://example.test/',
        storage: null,
      });
      let navigateEvent: (Event & {
        formData: FormData | null;
        sourceElement: Element | null;
        userInitiated: boolean;
      }) | undefined;
      navigation.addEventListener('navigate', event => {
        navigateEvent = event as Event & {
          formData: FormData | null;
          sourceElement: Element | null;
          userInitiated: boolean;
        };
      });

      const submit = new Event('submit', { cancelable: true });
      document.dispatch(
        'submit',
        submit,
        new TestForm('https://example.test/search?old=1', 'get', [['q', 'blue sky']])
      );
      await navigation.transition?.finished;

      expect(submit.defaultPrevented).toBe(true);
      expect(navigation.currentEntry.url).toBe('https://example.test/search?q=blue+sky');
      expect(navigateEvent?.userInitiated).toBe(false);
      expect(navigateEvent?.formData).toBe(null);
      expect(navigateEvent?.sourceElement).toBeInstanceOf(TestForm);
      navigation.dispose();
    });
  });

  it('exposes POST form data on the navigate event', async () => {
    const document = new TestDocument();
    await withDocument(document, async () => {
      const navigation = new NavigationFacade({
        initialUrl: 'https://example.test/',
        storage: null,
      });
      let navigateEvent: (Event & { formData: FormData | null }) | undefined;
      navigation.addEventListener('navigate', event => {
        navigateEvent = event as Event & { formData: FormData | null };
      });

      const submit = new Event('submit', { cancelable: true });
      document.dispatch(
        'submit',
        submit,
        new TestForm('https://example.test/search', 'post', [['q', 'blue sky']])
      );
      await navigation.transition?.finished;

      expect(submit.defaultPrevented).toBe(true);
      expect(navigation.currentEntry.sameDocument).toBe(false);
      expect(navigateEvent?.formData?.get('q')).toBe('blue sky');
      navigation.dispose();
    });
  });

  it('intercepts programmatic form.submit() and restores the native method on dispose', async () => {
    const document = new TestDocument();
    await withDocument(document, async () => {
      const navigation = new NavigationFacade({
        initialUrl: 'https://example.test/',
        storage: null,
      });
      let navigationType: string | undefined;
      navigation.addEventListener('navigate', event => {
        navigationType = (event as Event & { navigationType: string }).navigationType;
      });

      const form = new TestForm('https://example.test/submit', 'post', [['value', 'sent']]);
      form.submit();
      await navigation.transition?.finished;

      expect(navigation.currentEntry.url).toBe('https://example.test/submit');
      expect(navigationType).toBe('replace');
      navigation.dispose();
      form.submit();
      expect(form.nativeSubmitCalled).toBe(true);
    });
  });
});
