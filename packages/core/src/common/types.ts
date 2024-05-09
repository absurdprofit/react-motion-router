import { isValidElement } from 'react';
import { NavigationBase } from '../NavigationBase';
import { ScreenBase, ScreenBaseProps } from '../ScreenBase';
import {
    GestureCancelEvent,
    GestureEndEvent,
    GestureStartEvent,
    MotionProgressEndEvent,
    MotionProgressEvent,
    MotionProgressStartEvent,
    TransitionCancelEvent,
    TransitionEndEvent,
    TransitionStartEvent
} from './events';
import { SharedElement } from '../SharedElement';

export type ScreenChild<P extends ScreenBaseProps = ScreenBaseProps, E extends ScreenBase<P> = ScreenBase<P>> = React.CElement<P, E>;

enum EasingFunctionKeywordEnum {
    "ease",
    "ease-in",
    "ease-in-out",
    "ease-out",
    "linear"
}

export type EasingFunctionKeyword = keyof typeof EasingFunctionKeywordEnum;
export type EasingFunction = EasingFunctionKeyword | `cubic-bezier(${number},${' ' | ''}${number},${' ' | ''}${number},${' ' | ''}${number})`;

export type ParamsSerializer = (params: PlainObject) => string;
export type ParamsDeserializer = (queryString: string) => PlainObject;

export interface AnimationEffectFactoryProps<R extends HTMLElement = HTMLElement> {
    ref: R | null;
    index: number;
    exiting: boolean;
    timeline: AnimationTimeline;
    playbackRate: number;
    direction: "normal" | "reverse";
}

export type AnimationEffectFactory<R extends HTMLElement = HTMLElement> = (props: AnimationEffectFactoryProps<R>) => AnimationEffect;

export interface Vec2 {
    x: number;
    y: number;
}

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export type MetaTypeKey = 'http-equiv' | 'name' | 'itemprop' | 'property' | 'charset';
export type MetaType = [MetaTypeKey, string];
export type MetaKey = `${MetaTypeKey}=${string}`;

export type SearchParamsDeserializer = (queryString: string) => PlainObject;
export type SearchParamsSerializer = (params: PlainObject) => string;

export interface LazyExoticComponent<T extends React.ComponentType<any>> extends React.LazyExoticComponent<T> {
    load: () => Promise<{ default: T }>;
}

export type ScreenState<P extends ScreenBaseProps = ScreenBaseProps> = Map<string, Pick<RoutePropBase<P["config"], PlainObject>, "config" | "params">>;

export interface RoutePropBase<C extends ScreenBaseProps["config"] = {}, P extends PlainObject = PlainObject> {
    path: string;
    resolvedPathname?: string;
    config: Partial<NonNullable<C>>;
    focused: boolean;
    params: P;
    setParams(params: Partial<P>): void;
    setConfig(config: Partial<NonNullable<C>>): void;
}

export interface ScreenComponentBaseProps<
    R extends RoutePropBase = RoutePropBase,
    N extends NavigationBase = NavigationBase
> {
    route: R;
    navigation: N;
}

export function isValidComponentConstructor(value: any): value is React.ComponentType<any> {
    if (value === null) return false;
    return typeof value === 'function' ||
        (typeof value === 'object' && value.$$typeof === Symbol.for('react.lazy'));
}

export function isValidScreenChild<S extends ScreenBase>(value: any): value is ScreenChild<S["props"], S> {
    if (!isValidElement(value)) return false;
    return Object.getPrototypeOf(value.type) === ScreenBase;
}

export type PlainObject<T = any> = { [key: string]: T };

export interface RouterBaseEventMap extends HTMLElementEventMap {
    [key: string]: Event;
    "transition-start": TransitionStartEvent;
    "transition-cancel": TransitionCancelEvent;
    "transition-end": TransitionEndEvent;
    "gesture-start": GestureStartEvent;
    "gesture-end": GestureEndEvent;
    "gesture-cancel": GestureCancelEvent;
    "motion-progress-start": MotionProgressStartEvent;
    "motion-progress": MotionProgressEvent;
    "motion-progress-end": MotionProgressEndEvent;
}

export interface HTMLRouterBaseElement extends HTMLElement {
    addEventListener<K extends keyof RouterBaseEventMap>(type: K, listener: (this: HTMLDivElement, ev: RouterBaseEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof RouterBaseEventMap>(type: K, listener: (this: HTMLDivElement, ev: RouterBaseEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export type KeyOf = Pick<RouterBaseEventMap, "motion-progress-end">;

export type CustomElementType = string;

export interface MatchedRoute {
    exact: boolean;
    params?: PlainObject<string | undefined>;
}

export interface PathPattern {
    pattern: string;
    caseSensitive: boolean;
}

export type AnimationDirection = "normal" | "reverse";

//https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin#formal_syntax
//https://stackoverflow.com/questions/51445767/how-to-define-a-regex-matched-string-type-in-typescript
enum TransformOriginKeywordEnum {
    center,
    top,
    bottom,
    left,
    right,
};

enum TransformOriginLengthUnitEnum {
    cap, ch, em, ex, ic, lh, rem, rlh, //relative length
    vh, vw, vi, vb, vmin, vmax,       //viewport percentage length
    px, cm, mm, Q, in, pc, pt,       //absolute length
    '%'
}

enum TransformOriginGlobalEnum {
    initial,
    inherit,
    revert,
    unset
}

enum SharedElementTransitionTypeEnum {
    "morph",
    "fade-through",
    "fade",
    "cross-fade"
}

export type SharedElementTransitionType = keyof typeof SharedElementTransitionTypeEnum;

export type TransformOriginGlobal = keyof typeof TransformOriginGlobalEnum;

export type TransformOriginLengthUnit = keyof typeof TransformOriginLengthUnitEnum;
//e.g. 20px, 20%, 20rem
export type TransformOriginLength = `${number}${TransformOriginLengthUnit}` | 0;

export type TransformOriginKeyword = keyof typeof TransformOriginKeywordEnum;
export type OneValueTransformOrigin = TransformOriginKeyword | TransformOriginLength;
export type TwoValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin}`;
export type ThreeValueTransformOrigin = `${OneValueTransformOrigin} ${OneValueTransformOrigin} ${TransformOriginLength}`;
export type TransformOrigin = TransformOriginGlobal | OneValueTransformOrigin | TwoValueTransformOrigin | ThreeValueTransformOrigin;

export interface SharedElementNode {
    id: string;
    instance: SharedElement;
}

export type SharedElementNodeMap = Map<string, SharedElementNode>;