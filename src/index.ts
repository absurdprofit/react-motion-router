import { ScreenChild, SharedElement, AnimationConfig, AnimationConfigFactory } from './common/types';
import Router from './Router';
import {Stack} from './Stack';
import {Navigation, History} from './common/utils';
import Anchor from './Anchor';
import {Motion} from './AnimationLayer';
import './css/index.css';
import 'web-gesture-events';


export type {AnimationConfig, AnimationConfigFactory, ScreenChild};
export {Router, Stack, SharedElement, Navigation, History, Anchor, Motion};