
/**
 * Disabled page scrolling.
 */
 export function disable_scroll() {
    const html = document.getElementsByTagName('html')[0];
    html.style.overflowY = "hidden";
    html.style.overflowX = "hidden";
    html.style.overscrollBehavior = "none";
}

/**
 * Enable page scrolling.
 */
export function enable_scroll() {
    const html = document.getElementsByTagName('html')[0];
    html.style.overflowY = "visible";
    html.style.overflowX = "visible";
    html.style.overscrollBehavior = "auto";
}

export function get_css_text(styles: CSSStyleDeclaration): string {
    if (styles.cssText !== '') {
        return styles.cssText;
    } else {
        const css_text = Object.values(styles).reduce(
            (css, property_name) =>
                `${css}${property_name}:${styles.getPropertyValue(
                    property_name
                )};`
        );

        return css_text;
    }
}

export function clamp(num: number, min: number, max?: number) {
    if (num < min) {
        return min;
    } else if (max && num > max) {
        return max;
    }
    return num;
}