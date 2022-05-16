import {Stack} from '../Stack';
import _SharedElement from '../SharedElement';

const SharedElement = _SharedElement.SharedElement;
export type ScreenChild = React.ReactElement<React.ComponentProps<typeof Stack.Screen>,React.JSXElementConstructor<typeof Stack.Screen>>;

enum AnimationDirectionEnum {
    up,
    down,
    left,
    right,
    in,
    out
}

enum AnimationTypeEnum {
    slide,
    fade,
    zoom,
    none
}

enum EasingFunctionKeywordEnum {
    "ease",
    "ease-in",
    "ease-in-out",
    "ease-out",
    "linear"
}

export type EasingFunctionKeyword = keyof typeof EasingFunctionKeywordEnum;
export type EasingFunction = EasingFunctionKeyword  | `cubic-bezier(${number},${' ' | ''}${number},${' ' | ''}${number},${' ' | ''}${number})`;

export type ParamsSerialiser = (params: {[key:string]: any}) => string;
export type ParamsDeserialiser = (queryString: string) => {[key:string]: any};

export type AnimationType = keyof typeof AnimationTypeEnum;
export type AnimationDirection = keyof typeof AnimationDirectionEnum;
export interface AnimationConfig {
    type: AnimationType;
    direction?: AnimationDirection;
    duration: number;
    easingFunction?: EasingFunction;
}

export interface AnimationKeyframeEffectConfig {
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null;
    options?: number | KeyframeEffectOptions;
}

export interface AnimationConfigSet {
    in: AnimationConfig | AnimationKeyframeEffectConfig;
    out: AnimationConfig | AnimationKeyframeEffectConfig;
}

export type ReducedAnimationConfigSet = Partial<AnimationConfigSet> & Pick<AnimationConfigSet, 'in'>;

export type AnimationConfigFactory = (currentPath: string, nextPath: string, gestureNavigating: boolean) => AnimationConfig | AnimationKeyframeEffectConfig | ReducedAnimationConfigSet;

export {SharedElement};

export interface Vec2 {
    x: number;
    y: number;
}

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
