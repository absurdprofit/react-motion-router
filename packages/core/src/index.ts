import {
    ScreenChild,
    SharedElement,
    AnimationConfig,
    AnimationConfigFactory
} from './common/types';
import RouterData from './RouterData';
import { useReducedMotion, useMotion, useNavigation } from './common/utils';
import NavigationBase, { BackEvent, NavigateEvent } from './NavigationBase';
import HistoryBase from './HistoryBase';
import Anchor from './Anchor';
import {Motion} from './AnimationLayer';
import GestureRegion from './GestureRegion';
import 'web-gesture-events';
import {
    MotionProgressEndEvent,
    MotionProgressEvent,
    MotionProgressStartEvent,
    PageAnimationEndEvent,
    PageAnimationStartEvent
} from './MotionEvents';

document.body.style.position = 'fixed';
document.body.style.top = '0';
document.body.style.left = '0';
document.body.style.right = '0';
document.body.style.bottom = '0';

let root = document.getElementById('root');
if (root) {
    root.style.width = '100%';
    root.style.height = '100%';
}

interface MotionEventsMap {
    "page-animation-start": PageAnimationStartEvent;
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

export type {AnimationConfig, AnimationConfigFactory, ScreenChild};
export {SharedElement, useNavigation, Anchor, Motion, NavigationBase, HistoryBase, GestureRegion, RouterData};
export {useReducedMotion, useMotion};
export type {MotionProgressEndEvent, MotionProgressEvent, MotionProgressStartEvent};