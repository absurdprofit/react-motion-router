import {
    ScreenChild,
    AnimationEffectFactory,
} from './common/types';
import { RouterData, RouterDataContext } from './RouterData';
import { NavigationBase, NavigationBaseProps, NavigationBaseOptions } from './NavigationBase';
import { RouterBase, RouterBaseProps, RouterBaseState } from './RouterBase';
import { ScreenBase, ScreenBaseProps, ScreenBaseState } from './ScreenBase';
import { Motion } from './AnimationLayer';
import type { AnimationLayerData } from './AnimationLayerData';
import { GestureRegion } from './GestureRegion';
import 'web-gesture-events';
import { ScrollRestoration } from './ScrollRestoration';
import { URLPattern } from "urlpattern-polyfill";
import { SharedElement } from './SharedElement';

// @ts-ignore: Property 'UrlPattern' does not exist 
if (!globalThis.URLPattern) {
    // @ts-ignore: Property 'UrlPattern' does not exist 
    globalThis.URLPattern = URLPattern;
}

document.body.style.position = 'fixed';
document.body.style.inset = '0';

const title = document.head.querySelector('title');
if (title)
    title.ariaLive = "polite";

let root = document.getElementById('root');
if (root) {
    root.style.width = '100%';
    root.style.height = '100%';
}

export type {
    AnimationEffectFactory,
    ScreenChild,
    RouterBaseProps,
    RouterBaseState,
    ScreenBaseProps,
    ScreenBaseState,
    NavigationBaseProps,
    NavigationBaseOptions
};
export { SharedElement, Motion, GestureRegion, ScrollRestoration };
export { NavigationBase, RouterBase, RouterData, RouterDataContext, ScreenBase };
export type {
    AnimationLayerData
};
export * from './common/hooks';
export * from './common/types';
export * from './common/events';
export * from './common/utils';
export * from './common/constants';
export * from './animation-configs/keyframe-presets';