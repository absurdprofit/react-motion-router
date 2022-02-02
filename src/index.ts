import Router from './Router';
import {Stack} from './Stack';
import _SharedElement from './SharedElement';
import {Navigation, History} from './common/utils';
import Anchor from './Anchor';
import 'web-gesture-events';

const SharedElement = _SharedElement.SharedElement;
export type ScreenChild = React.ReactElement<React.ComponentProps<typeof Stack.Screen>,React.JSXElementConstructor<typeof Stack.Screen>>;
export type ScreenChildren = React.ReactElement<React.ComponentProps<typeof Stack.Screen>,React.JSXElementConstructor<typeof Stack.Screen>>[]
export {Router, Stack, SharedElement, Navigation, History, Anchor};