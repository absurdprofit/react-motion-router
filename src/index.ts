import { ScreenChild, SharedElement, AnimationConfig, AnimationConfigFactory } from './common/types';
import Router, { useNavigation } from './Router';
import {Stack} from './Stack';
import {Navigation, History} from './common/utils';
import Anchor from './Anchor';
import {Motion} from './AnimationLayer';
import 'web-gesture-events';

document.body.style.position = 'fixed';
document.body.style.top = '0';
document.body.style.left = '0';
document.body.style.right = '0';
document.body.style.bottom = '0';

export type {AnimationConfig, AnimationConfigFactory, ScreenChild};
export {Router, Stack, SharedElement, Navigation, History, Anchor, Motion, useNavigation};