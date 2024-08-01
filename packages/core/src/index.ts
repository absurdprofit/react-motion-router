/// <reference types="urlpattern-polyfill" />
document.body.style.position = 'fixed';
document.body.style.inset = '0';
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