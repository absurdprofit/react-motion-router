/// <reference types="urlpattern-polyfill" />
import {
    ScreenChild,
    AnimationEffectFactory,
} from './common/types';
import { NavigationBase } from './NavigationBase';
import { RouterBase, RouterBaseProps, RouterBaseState } from './RouterBase';
import { ScreenBase, ScreenBaseProps, ScreenBaseState } from './ScreenBase';
import { Motion } from './ScreenTransitionLayer';
import 'web-gesture-events';
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
    ScreenBaseState
};
export { SharedElement, Motion };
export { NavigationBase, RouterBase, ScreenBase };
export * from './RouterContext';
export * from './common/hooks';
export * from './common/types';
export * from './common/events';
export * from './common/utils';
export * from './common/constants';