import {
    ScreenChild,
    SharedElement,
    AnimationConfig,
    AnimationConfigFactory
} from './common/types';
import RouterData from './RouterData';
import NavigationBase from './NavigationBase';
import type {
    BackEvent,
    BackEventDetail,
    NavigateEvent,
    NavigateEventDetail,
    NavigateOptions,
    NavigationOptions,
    GoBackOptions
} from './NavigationBase';
import RouterBase, { RouterBaseProps, RouterBaseState } from './RouterBase';
import ScreenBase, { ScreenBaseProps, ScreenBaseState } from './ScreenBase';
import HistoryBase from './HistoryBase';
import Anchor from './Anchor';
import { Motion } from './AnimationLayer';
import type AnimationLayerData from './AnimationLayerData';
import GestureRegion from './GestureRegion';
import 'web-gesture-events';
import {
    MotionProgressEndEvent,
    MotionProgressEvent,
    MotionProgressStartEvent,
    PageAnimationCancelEvent,
    PageAnimationEndEvent,
    PageAnimationStartEvent
} from './MotionEvents';
import ScrollRestoration from './ScrollRestoration';

document.body.style.position = 'fixed';
document.body.style.inset = '0';

let root = document.getElementById('root');
if (root) {
    root.style.width = '100%';
    root.style.height = '100%';
}

interface MotionEventsMap {
    "page-animation-start": PageAnimationStartEvent;
    "page-animation-cancel": PageAnimationCancelEvent;
    "page-animation-end": PageAnimationEndEvent;
    "motion-progress-start": MotionProgressStartEvent;
    "motion-progress": MotionProgressEvent;
    "motion-progress-end": MotionProgressEndEvent;
    "go-back": BackEvent;
    "navigate": NavigateEvent;
}

declare global {
    interface GlobalEventHandlersEventMap extends MotionEventsMap {}
}

export type {
    AnimationConfig,
    AnimationConfigFactory,
    ScreenChild,
    RouterBaseProps,
    RouterBaseState,
    ScreenBaseProps,
    ScreenBaseState
};
export {SharedElement, Anchor, Motion, GestureRegion, ScrollRestoration};
export {NavigationBase, HistoryBase, RouterBase, RouterData, ScreenBase};
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