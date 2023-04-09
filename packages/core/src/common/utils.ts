export function getCSSData(styles: CSSStyleDeclaration, object: boolean = true): [string, {[key:string]:string}] {
    let text = '';
    const styleObject: {[key:string]: string} = {};
    let j = 0;
    for (let property in styles) {
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

export function getStyleObject(styles: CSSStyleDeclaration): {[key:string]: string} {
    const styleObject: {[key:string]:string} = {};
    for (const key in styles) {
        if (styles[key] && styles[key].length && typeof styles[key] !== "function") {
            if (/^\d+$/.test(key)) continue;
            if (key === "offset") continue;
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
    for (let i = 0; i < routeTest.length; i++) {
        if (routeTest[i] !== route[i]) {
            rest = route.substring(i);
            break;
        } else
            matchedPathname += routeTest[i];
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