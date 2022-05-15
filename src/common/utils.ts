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

export function matchRoute(routeTest: string | RegExp | undefined, routeString: string | undefined): boolean {
    if (typeof routeTest === "string" || typeof routeTest === "undefined") {
        return routeTest === routeString;
    }
    if (routeTest instanceof RegExp && routeString) {
        return routeTest.test(routeString);
    } else {
        return false;
    }
}

export function includesRoute(routeString: string | undefined, routeTests: (string | RegExp | undefined)[]) {
    return routeTests.some((routeTest) => matchRoute(routeTest, routeString));
}
