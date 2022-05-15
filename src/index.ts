import {
    ScreenChild,
    SharedElement,
    AnimationConfig,
    AnimationConfigFactory
} from './common/types';
import Router, { useNavigation } from './Router';
import {Stack} from './Stack';
import Navigation from './Navigation';
import History from './History';
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

interface MotionEventsMap {
    "page-animation-start": PageAnimationStartEvent;
    "page-animation-end": PageAnimationEndEvent;
    "motion-progress-start": MotionProgressStartEvent;
    "motion-progress": MotionProgressEvent;
    "motion-progress-end": MotionProgressEndEvent;
}

declare global {
    interface GlobalEventHandlersEventMap extends MotionEventsMap {}
}

export type {AnimationConfig, AnimationConfigFactory, ScreenChild, Navigation, History};
export {Router, Stack, SharedElement, Anchor, Motion, useNavigation, GestureRegion};