import {
    ScreenChild,
    AnimationEffectFactory,
} from './common/types';
import { NavigationBase, NavigationBaseProps, NavigationBaseOptions } from './NavigationBase';
import { RouterBase, RouterBaseProps, RouterBaseState } from './RouterBase';
import { ScreenBase, ScreenBaseProps, ScreenBaseState } from './ScreenBase';
import { Motion } from './ScreenTransitionLayer';
import { GestureRegion } from './GestureRegion';
import 'web-gesture-events';
import { ScrollRestoration } from './ScrollRestoration';
import { SharedElement } from './SharedElement';

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
export { NavigationBase, RouterBase, ScreenBase };
export * from './RouterContext';
export * from './common/hooks';
export * from './common/types';
export * from './common/events';
export * from './common/utils';
export * from './common/group-effect';
export * from './common/constants';
export * from './animation-configs/keyframe-presets';