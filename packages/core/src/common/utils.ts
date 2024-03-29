import { Children, lazy as ReactLazy, isValidElement } from "react";
import { RouterData } from "../RouterData";
import { ScreenBaseProps } from "../ScreenBase";
import { Input, LazyExoticComponent, LerpRange, MatchedRoute, Output, PlainObject, ScreenChild, SearchParamsDeserializer, SearchParamsSerializer, Weights, is1DRange } from "./types";

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

export function matchRoute(
    routeTest: string,
    route: string,
    baseURL: string = window.location.origin,
    caseSensitive: boolean = true
): MatchedRoute | null {
    if (!caseSensitive) {
        routeTest = routeTest.toLowerCase();
        route = route.toLowerCase();
    }
    const pattern = new URLPattern(baseURL + routeTest);
    const match = pattern.exec(route, baseURL);
    const params = match?.pathname.groups ?? {};
    if (match) {
        return {
            exact: routeTest === route,
            params
        };
    }
    return null;
}

export function includesRoute(routeString: string, routeTests: string[], baseURL: string = window.location.origin) {
    return routeTests.some((routeTest) => matchRoute(routeTest, routeString, baseURL));
}

export function dispatchEvent<T>(event: CustomEvent<T> | Event, target: HTMLElement | EventTarget = window) {
    return new Promise<boolean>((resolve) => {
        queueMicrotask(() => resolve(
            target.dispatchEvent(event)
        ));
    });
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
    const Component = ReactLazy(factory) as LazyExoticComponent<T>;
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
            Children.forEach<ScreenChild<ScreenBaseProps>>(routes, (route) => {
                if (found) return; // stop after first
                if (!isValidElement(route)) return;
                const matchInfo = matchRoute(route.props.path, path);
                if (!matchInfo) return;
                found = true;
                queueMicrotask(async () => {
                    const preloadTasks = [];
                    if ('preload' in route.props.component) {
                        preloadTasks.push(route.props.component.preload());
                    }
                    if (route.props.config?.header?.component
                            && 'preload' in route.props.config?.header?.component) {
                        preloadTasks.push(route.props.config?.header?.component.preload());
                    }
                    if (route.props.config?.footer?.component
                        && 'preload' in route.props.config?.footer?.component) {
                        preloadTasks.push(route.props.config?.footer?.component.preload());
                    }
                    try {
                        await Promise.all(preloadTasks);
                        resolve(found);
                    } catch (e) {
                        reject(e);
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

function mapRange(input: number, outputRange: number[]): number {
    const segments = outputRange.length - 1;
    const segmentIndex = Math.floor(input * segments);
    const segmentMin = outputRange[segmentIndex];
    const segmentMax = outputRange[Math.min(segmentIndex + 1, segments)];
    const segmentInput = (input * segments) - segmentIndex;
    return segmentMin + segmentInput * (segmentMax - segmentMin);
}

function calculateWeightedMean(input: Input, range: LerpRange, weights: Weights) {
    let weightedSum = 0;
    let weightSum = 0;
    for (const [dimension, inputValue] of Object.entries(input)) {
        const {min, max} = range;
        const weight = weights[dimension] ?? 1;
        const normalised = (inputValue - min[dimension]) / (max[dimension] - min[dimension]);
        const weighted = normalised * weight;
        weightedSum += weighted;
        weightSum += weight;
    }
    return weightedSum / weightSum;
}

export function interpolate<O extends LerpRange | number[]>(input: number, inputRange: [number, number], outputRange: O): O extends number[] ? number : Output;
export function interpolate<O extends LerpRange | number[]>(input: Input, inputRange: LerpRange, outputRange: O, weights: Weights): O extends number[] ? number : Output;
export function interpolate(input: Input | number, inputRange: LerpRange | number[], outputRange: number[] | LerpRange, weights: Weights = {}) {
    let inputInterpolatedValue;
    if (typeof input === "number" && is1DRange(inputRange)) {
        const min = {x: inputRange[0]};
        const max = {x: inputRange[1]};
        inputRange = {min, max};
        input = {x: input};
    }else {
        throw new TypeError("Input and input range must have the same dimensions.");
    }
    inputInterpolatedValue = calculateWeightedMean(input, inputRange, weights);
    
    if (is1DRange(outputRange)) {
        return mapRange(inputInterpolatedValue, outputRange);
    }
    // create output ranges (min/max) for each dimension and mapRange for each
    const output: Output = {};
    for (const dimension of Object.keys(outputRange.min)) {
        const min = outputRange.min[dimension];
        const max = outputRange.max[dimension];
        const range = [min, max];
        output[dimension] = mapRange(inputInterpolatedValue, range);
    }
    return output;
}