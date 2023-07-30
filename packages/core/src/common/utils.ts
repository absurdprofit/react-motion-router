import React from "react";
import RouterData from "../RouterData";
import { ScreenBaseProps } from "../ScreenBase";
import { LazyExoticComponent, PlainObject, ScreenChild, SearchParamsDeserializer, SearchParamsSerializer } from "./types";

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
                switch(propertyName) {
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

export function clamp(num: number, min: number, max?: number) {
    if (num < min) {
        return min;
    } else if (max && num > max) {
        return max;
    }
    return num;
}

export interface MatchedRoute {
    matchedPathname?: string;
    rest?: string;
    exact: boolean;
}

export function matchRoute(
    routeTest: string | undefined,
    route: string | undefined,
    baseURL: string = window.location.origin
): MatchedRoute | null {
    if (typeof routeTest === "undefined" || typeof route === "undefined") {
        if (routeTest === route) {
            return {
                exact: true,
                matchedPathname: route
            }
        }
        return null;
    }
    const pattern = new URLPattern(routeTest, baseURL);
    const routeURL = new URL(route!, baseURL);
    const match = pattern.exec(routeURL);
    let matchedPathname = '';
    let rest = '';
    for (let i = 0; i < pattern.pathname.length; i++) {
        if (pattern.pathname[i] !== routeURL.pathname[i]) {
            rest = routeURL.pathname.substring(i);
            break;
        } else
            matchedPathname += pattern.pathname[i];
    }
    if (match) {
        return {
            exact: routeTest === route,
            matchedPathname,
            rest
        };
    }
    return null;
}

export function includesRoute(routeString: string | undefined, routeTests: (string | undefined)[], baseURL: string = window.location.origin) {
    return routeTests.some((routeTest) => matchRoute(routeTest, routeString, baseURL));
}

export function dispatchEvent<T>(event: CustomEvent<T> | Event, target: HTMLElement | EventTarget = window) {
    return new Promise<boolean>((resolve) => {
        queueMicrotask(() => resolve(
            target.dispatchEvent(event)
        ));
    });
}

export function concatenateURL(path: string | URL, base: string | URL) {
    if (typeof base === "string") {
        base = new URL(base);
    }
    if (typeof path !== "string") {
        path = path.pathname;
    }
    // replace leading slash from then add trailing slash to base
    // when this is combined with the URL API, automatic nested occurs
    path = path.replace(/^\//, '');
    if (!base.pathname.endsWith('/')) {
        base = new URL(base.href + '/');
    }
    return new URL(path, base);
}

export function defaultSearchParamsToObject(searchPart: string) {
    const entries = new URLSearchParams(decodeURI(searchPart)).entries();
    const result: PlainObject<string> = {};
    
    for(const [key, value] of entries) { // each 'entry' is a [key, value] tuple
        let parsedValue = '';
        try {
            parsedValue = JSON.parse(value);
        } catch (e) {
            console.warn("Non JSON serialisable value was passed as URL route param.");
            parsedValue = value;
        }
        result[key] = parsedValue;
    }
    return Object.keys(result).length ? result : undefined;
}

export function searchParamsToObject(searchPart: string, paramsDeserializer: SearchParamsDeserializer | null) {
    const deserializer = paramsDeserializer || defaultSearchParamsToObject;
    const currentParams = deserializer(searchPart) || {};
    return currentParams;
}

export function searchParamsFromObject(params: {[key: string]: any}, paramsSerializer: SearchParamsSerializer | null) {
    try {
        const serializer = paramsSerializer || function(paramsObj) {
            return new URLSearchParams(paramsObj).toString();
        }
        return serializer(params);
    } catch (e) {
        console.error(e);
        console.warn("Non JSON serialisable value was passed as route param to Anchor.");
    }
    return '';
}

export function lazy<T extends React.ComponentType<any>>(
    factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
    const Component = React.lazy(factory) as LazyExoticComponent<T>;
    Component.preload = () => {
        const result = factory();
        result
        .then(moduleObject => Component.preloaded = moduleObject.default)
        .catch(console.error);
        return result;
    };
    return Component;
}

/**
 * Searches router data tree for matching screen. Once the screen is found
 * its component is preloaded.
 * @param path 
 * @param routerData 
 * @returns 
 */
export function prefetchRoute(path: string, routerData: RouterData) {
    let currentRouterData: RouterData | null = routerData;
    return new Promise<boolean>((resolve, reject) => {
        let found = false;
        while(currentRouterData) {
            const routes = currentRouterData.routes;
            React.Children.forEach<ScreenChild<ScreenBaseProps>>(routes, (route) => {
                if (found) return; // stop after first
                if (!React.isValidElement(route)) return;
                const matchInfo = matchRoute(route.props.path, path);
                if (!matchInfo) return;
                found = true;
                queueMicrotask(async () => {
                    if ('preload' in route.props.component) {
                        try {
                            await route.props.component.preload();
                            resolve(found);
                        } catch (e) {
                            reject(e);
                        }
                    }
                });
            });
            if (!found) {
                currentRouterData = routerData.parentRouterData;
            } else {
                break;
            }
        }
        if (!found)
            resolve(false);
    });
}

export function getAnimationDuration(animation: Animation | null, defaultDuration: number = 0) {
    const duration = animation?.effect?.getTiming().duration;
    return Number(duration) || defaultDuration;
}

export const DEFAULT_ANIMATION = {
    in: {
        type: 'none',
        duration: 0
    },
    out: {
        type: 'none',
        duration: 0
    }
} as const;