/// <reference types="urlpattern-polyfill" />
import 'web-gesture-events';

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

export * from './SharedElement';
export * from './RouterBase';
export * from './ScreenBase';
export * from './NavigationBase';
export * from './MotionContext';
export * from './RouterContext';
export * from './common/hooks';
export * from './common/types';
export * from './common/events';
export * from './common/utils';
export * from './common/constants';