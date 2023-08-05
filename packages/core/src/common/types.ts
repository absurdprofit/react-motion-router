import HistoryBase from '../HistoryBase';
import NavigationBase from '../NavigationBase';
import ScreenBase, { ScreenBaseProps } from '../ScreenBase';

export type ScreenChild<P extends ScreenBaseProps = ScreenBaseProps, E extends typeof ScreenBase = typeof ScreenBase> = React.ReactElement<P, React.JSXElementConstructor<E>>;

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

export type ParamsSerializer = (params: PlainObject) => string;
export type ParamsDeserializer = (queryString: string) => PlainObject;

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

export interface Vec2 {
    x: number;
    y: number;
}

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export type MetaTypeKey = 'http-equiv' | 'name' | 'itemprop' | 'property' | 'charset';
export type MetaType = [MetaTypeKey, string];
export type MetaKey = `${MetaTypeKey}=${string}`;

export type SearchParamsDeserializer = (queryString: string) => PlainObject;
export type SearchParamsSerializer = (params: PlainObject) => string;

export interface LazyExoticComponent<T extends React.ComponentType<any>> extends React.LazyExoticComponent<T> {
    preload: () => Promise<{ default: T }>;
    preloaded: T | undefined;
}

export interface RouteProp<T> {
    path: string | undefined;
    params: T;
    preloaded: boolean;
}
export interface ScreenComponentBaseProps<T extends PlainObject = {}, N extends NavigationBase = NavigationBase> {
    route: RouteProp<T>;
    navigation: N;
    orientation: ScreenOrientation;
}

export function isValidComponentConstructor(value: any): value is React.ComponentType<any> {
    if (value === null) return false;
    return typeof value === 'function' ||
        (typeof value === 'object' && value.$$typeof === Symbol.for('react.lazy'));
}

export type PlainObject<T = any> = {[key:string]: T};

export type RouterEventMap = Pick<HTMLElementEventMap, "navigate" | "go-back" | "motion-progress" | "motion-progress-start" | "motion-progress-end" | "page-animation-start" | "page-animation-end" | "page-animation-cancel">;

export type NodeAppendedEvent = CustomEvent<{node: Node;}>;
export type NodeRemovedEvent = CustomEvent<{node: Node;}>;