import { cloneElement, lazy as ReactLazy } from 'react';
import {
  ClonedElementType,
  ElementPropType,
  LazyExoticComponent,
  MatchedRoute,
  PathPattern
} from './types';
import { LAST_INDEX } from './constants';

export function resolveBaseURLFromPattern(pattern: string, pathname: string) {
  if (!pattern.endsWith('*')) pattern += '**'; // allows us to match nested routes
  const origin = window.location.origin;
  const baseURLMatch = new URLPattern(pattern, origin).exec(pathname, origin);
  if (!baseURLMatch) return null;

  const groups = Object.keys(baseURLMatch.pathname.groups)
    .filter((key) => !isNaN(Number(key)))
    .map((key) => baseURLMatch.pathname.groups[key])
    .filter((group) => group !== undefined);
  const nestedPathnameGroup = groups.at(LAST_INDEX) ?? '';
  // derive concrete baseURL
  return new URL(
    pathname.replace(nestedPathnameGroup, ''),
    window.location.origin
  );
}

export function matchRoute(
  pathnamePattern: string,
  pathname: string,
  baseURLPattern: string = `${window.location.origin}/`,
  caseSensitive: boolean = true
): MatchedRoute | null {
  if (!caseSensitive) {
    pathnamePattern = pathnamePattern.toLowerCase();
    pathname = pathname.toLowerCase();
  }

  const baseURL = resolveBaseURLFromPattern(baseURLPattern, pathname)?.href;
  if (!baseURL) return null;

  const match = new URLPattern({
    baseURL,
    pathname: pathnamePattern,
  }).exec({ pathname, baseURL });
  const params = match?.pathname.groups ?? {};
  if (match) {
    return {
      params,
      caseSensitive,
    };
  }
  return null;
}

export function dispatchEvent<T>(
  event: CustomEvent<T> | Event,
  target: HTMLElement | EventTarget = window
) {
  return new Promise<boolean>((resolve) => {
    queueMicrotask(() => resolve(
      target.dispatchEvent(event)
    ));
  });
}

export function lazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  const Component = ReactLazy(factory) as LazyExoticComponent<T>;
  Component.load = async () => {
    Component.module ??= await factory();
    return Component.module;
  };
  return Component;
}

export function isNavigationSupported() {
  return Boolean(window.navigation);
}

export function isURLPatternSupported() {
  // @ts-expect-error: Property 'UrlPattern' does not exist 
  return Boolean(globalThis.URLPattern);
}

export async function polyfillURLPattern() {
  const { URLPattern } = await import('urlpattern-polyfill');
  // @ts-expect-error: Property 'UrlPattern' does not exist 
  globalThis.URLPattern = URLPattern;
}

export async function polyfillNavigation() {
  const { applyPolyfill } = await import('@virtualstate/navigation');
  applyPolyfill({
    history: true,
    interceptEvents: true,
    patch: true,
    persist: true,
    persistState: true,
  });
}

export async function PromiseAllSequential<T>(
  values: Iterable<T | PromiseLike<T>>
): Promise<Awaited<T>[]> {
  const awaited = [];
  for (const value of values) {
    awaited.push(await value);
  }

  return awaited;
}

export function toCamelCase(value: string) {
  return value.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function cloneAndInject<
    C extends React.CElement<any, any>,
    IP extends Partial<ElementPropType<C>>
>(element: C, injectProps: IP) {
  return cloneElement(element, injectProps) as ClonedElementType<C, IP>;
}

export function omit<T extends object, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K
): Omit<T, K[number]> {
  const copy = { ...obj };
  for (const k of keys) delete copy[k];
  return copy;
}

export function historyEntryFromDestination(
  destination: NavigationDestination,
  index?: number
) {
  return Object.create(
    EventTarget.prototype,
    {
      id: {
        value: destination.id,
        enumerable: true,
        writable: false,
        configurable: false,
      },
      key: {
        value: destination.key,
        enumerable: true,
        writable: false,
        configurable: false,
      },
      url: {
        value: destination.url,
        enumerable: true,
        writable: false,
        configurable: false,
      },
      index: {
        value: index ?? destination.index,
        enumerable: true,
        writable: false,
        configurable: false,
      },
      sameDocument: {
        value: destination.sameDocument,
        enumerable: true,
        writable: false,
        configurable: false,
      },
      getState: {
        value: () => destination.getState(),
        enumerable: false,
        writable: false,
        configurable: false,
      },
      ondispose: {
        value: null,
        enumerable: true,
        writable: true,
        configurable: false,
      },
    }
  ) as NavigationHistoryEntry;
}