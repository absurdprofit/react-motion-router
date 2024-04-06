import {
    ScreenChild,
    AnimationFactory,
    NodeAppendedEvent,
    NodeRemovedEvent
} from './common/types';
import { RouterData } from './RouterData';
import { NavigationBase, NavigationProps } from './NavigationBase';
import type {
    BackEvent,
    BackEventDetail,
    NavigateEvent,
    NavigateEventDetail,
    NavigateOptions,
    NavigationOptions,
    GoBackOptions
} from './NavigationBase';
import { RouterBase, RouterBaseProps, RouterBaseState } from './RouterBase';
import { ScreenBase, ScreenBaseProps, ScreenBaseState } from './ScreenBase';
import { Anchor } from './Anchor';
import { Motion } from './AnimationLayer';
import type { AnimationLayerData } from './AnimationLayerData';
import { GestureRegion } from './GestureRegion';
import 'web-gesture-events';
import {
    GestureCancelEvent,
    GestureEndEvent,
    GestureStartEvent,
    MotionProgressEndEvent,
    MotionProgressEvent,
    MotionProgressStartEvent,
    TransitionCancelEvent,
    TransitionEndEvent,
    TransitionStartEvent
} from './common/events';
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
    AnimationFactory,
    ScreenChild,
    RouterBaseProps,
    RouterBaseState,
    ScreenBaseProps,
    ScreenBaseState,
    NavigationProps
};
export { SharedElement, Anchor, Motion, GestureRegion, ScrollRestoration };
export { NavigationBase, RouterBase, RouterData, ScreenBase };
export type {
    MotionProgressEndEvent,
    MotionProgressEvent,
    MotionProgressStartEvent,
    BackEvent,
    BackEventDetail,
    NavigateEvent,
    NavigateEventDetail,
    NavigateOptions,
    NavigationOptions,
    GoBackOptions,
    AnimationLayerData
};
export * from './common/hooks';
export * from './common/types';
export * from './common/utils';
export * from './common/constants';
export * from './AnimationPresets';