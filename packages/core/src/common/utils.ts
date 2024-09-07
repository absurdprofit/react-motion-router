import { cloneElement, lazy as ReactLazy } from "react";
import { ClonedElementType, ElementPropType, LazyExoticComponent, MatchedRoute, PathPattern } from "./types";
import { RouterBase } from "../RouterBase";

export function resolveBaseURLFromPattern(pattern: string, pathname: string) {
    if (!pattern.endsWith("**")) pattern += '**'; // allows us to match nested routes
    const origin = window.location.origin;
    const baseURLMatch = new URLPattern(pattern, origin).exec(pathname, origin);
    if (!baseURLMatch) return null;

    const groups = Object.keys(baseURLMatch.pathname.groups)
        .filter((key) => !isNaN(Number(key)))
        .map((key) => baseURLMatch.pathname.groups[key])
        .filter((group) => group !== undefined);
    const nestedPathnameGroup = groups.at(-1) ?? '';
    // derive concrete baseURL
    return new URL(pathname.replace(nestedPathnameGroup, ''), window.location.origin);
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

    const match = new URLPattern({ baseURL, pathname: pathnamePattern }).exec({ pathname, baseURL });
    const params = match?.pathname.groups ?? {};
    if (match) {
        return {
            params
        };
    }
    return null;
}

export function includesRoute(pathnamePatterns: PathPattern[], pathname: string, baseURL: string = window.location.origin) {
    return pathnamePatterns.some(({ pattern, caseSensitive }) => matchRoute(pattern, pathname, baseURL, caseSensitive));
}

export function dispatchEvent<T>(event: CustomEvent<T> | Event, target: HTMLElement | EventTarget = window) {
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
    // @ts-ignore: Property 'UrlPattern' does not exist 
    return Boolean(globalThis.URLPattern);
}

export async function polyfillURLPattern() {
    const { URLPattern } = await import(/*webpackIgnore: true*/ "urlpattern-polyfill");
    // @ts-ignore: Property 'UrlPattern' does not exist 
    globalThis.URLPattern = URLPattern;
}

export async function polyfillNavigation() {
    const { applyPolyfill } = await import(/*webpackIgnore: true*/ "@virtualstate/navigation");
    applyPolyfill({
        history: true,
        interceptEvents: true,
        patch: true,
        persist: true,
        persistState: true
    });
}

export async function PromiseAllDynamic<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>[]> {
    const awaited = [];
    for (const value of values) {
        awaited.push(await value);
    }

    return awaited;
}

export function toCamelCase(value: string) {
    return value.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

export function cloneAndInject<
    C extends React.CElement<any, any>,
    IP extends Partial<ElementPropType<C>>
>(element: C, injectProps: IP) {
    return cloneElement(element, injectProps) as ClonedElementType<C, IP>;
}