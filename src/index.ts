import { ScreenChild, SharedElement, AnimationConfig, AnimationConfigFactory } from './common/types';
import Router, { useNavigation } from './Router';
import {Stack} from './Stack';
import {Navigation, History} from './common/utils';
import Anchor from './Anchor';
import {Motion} from './AnimationLayer';
import GestureRegion from './GestureRegion';
import 'web-gesture-events';

document.body.style.position = 'fixed';
document.body.style.top = '0';
document.body.style.left = '0';
document.body.style.right = '0';
document.body.style.bottom = '0';

export type {AnimationConfig, AnimationConfigFactory, ScreenChild, Navigation, History};
export {Router, Stack, SharedElement, Anchor, Motion, useNavigation, GestureRegion};