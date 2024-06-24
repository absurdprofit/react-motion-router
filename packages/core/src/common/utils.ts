import { lazy as ReactLazy } from "react";
import { LazyExoticComponent, MatchedRoute, PathPattern, PlainObject } from "./types";

export function getCSSData(styles: CSSStyleDeclaration, exclude: string[] = [], object: boolean = true): [string, PlainObject<string>] {
    let text = '';
    const styleObject: PlainObject<string> = {};
    let j = 0;
    for (let property in styles) {
        if (exclude.includes(property)) continue;
        if (j < styles.length) {
            const propertyName = styles[property];
            let propertyValue = styles.getPropertyValue(propertyName);
            switch (propertyName) {
                case "visibility":
                    propertyValue = 'visible';
                    break;
            }
            text += `${propertyName}:${propertyValue};`;
        } else {
            if (!object) break;
            let propertyName = property;
            let propertyValue = styles[propertyName as any];
            if (
                typeof propertyValue === "string"
                && propertyName !== "cssText"
                && !propertyName.includes('webkit')
                && !propertyName.includes('grid')
            ) {
                switch (propertyName) {
                    case "offset":
                        propertyName = "cssOffset";
                        break;

                    case "float":
                        propertyName = "cssFloat";
                        break;

                    case "visibility":
                        propertyValue = "visible";
                        break;
                }

                styleObject[propertyName] = propertyValue;
            }
        }
        j++;
    }
    return [text, styleObject];
}

export function getStyleObject(styles: CSSStyleDeclaration, exclude: string[] = []): PlainObject<string> {
    const styleObject: PlainObject<string> = {};
    for (const key in styles) {
        if (styles[key] && styles[key].length && typeof styles[key] !== "function") {
            if (/^\d+$/.test(key)) continue;
            if (key === "offset") continue;
            if (exclude.includes(key)) continue;
            styleObject[key] = styles[key];
        }
    }
    return styleObject;
}

export function resolveBaseURLFromPattern(pattern: string, pathname: string) {
    if (!pattern.endsWith("**")) pattern += '**'; // allows us to match nested routes
    const origin = window.location.origin;
    const baseURLMatch = new URLPattern(pattern, origin).exec(pathname, origin);
    if (!baseURLMatch) return null;

    const nestedPathnameGroup = baseURLMatch.pathname.groups[0] ?? '';
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
            exact: pathnamePattern === pathname,
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

export function getAnimationDuration(animation: Animation | null, defaultDuration: number = 0) {
    const duration = animation?.effect?.getTiming().duration;
    return Number(duration) || defaultDuration;
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

export function isFirstLoad(info?: unknown) {
    if (info && typeof info === 'object' && 'firstLoad' in info)
        return Boolean(info.firstLoad);
    return false;
}

export async function PromiseAllDynamic<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>[]> {
    const awaited = [];
    for (const value of values) {
        awaited.push(await value);
    }

    return awaited;
}