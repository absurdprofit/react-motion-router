import { isValidElement } from 'react';
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
import { StandardPropertiesHyphen } from 'csstype';

export type ScreenChild<P extends ScreenBaseProps = ScreenBaseProps, E extends ScreenBase<P> = ScreenBase<P>> = React.CElement<P, E>;

export interface AnimationEffectFactoryProps<R extends HTMLElement = HTMLElement> {
    ref: R | null;
    index: number;
    exiting: boolean;
    timeline: AnimationTimeline | null;
    playbackRate: number;
    direction: PlaybackDirection;
}

export type AnimationEffectFactory<R extends HTMLElement = HTMLElement> = (props: AnimationEffectFactoryProps<R>) => AnimationEffect;

export interface Vec2 {
    x: number;
    y: number;
}

export type MetaTypeKey = 'http-equiv' | 'name' | 'itemprop' | 'property' | 'charset';
export type MetaType = [MetaTypeKey, string];
export type MetaKey = `${MetaTypeKey}=${string}`;

export interface LazyExoticComponent<T extends React.ComponentType<any>> extends React.LazyExoticComponent<T> {
    load: () => Promise<{ default: T }>;
    module?: { default: T };
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

export function isValidScreenChild<S extends ScreenBase>(value: any): value is ScreenChild<S["props"], S> {
    if (!isValidElement(value)) return false;
    return Object.getPrototypeOf(value.type) === ScreenBase;
}

export type PlainObject<T = any> = { [key: string]: T };

export interface RouterBaseEventMap extends HTMLElementEventMap {
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

export type RouterHTMLElement<E extends RouterBaseEventMap, T extends HTMLElement = HTMLDivElement> = T & {
    addEventListener<K extends keyof E>(type: K, listener: (this: T, ev: E[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof E>(type: K, listener: (this: T, ev: E[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export type CustomElementType = `${string}-${string}`;

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

export type StyleKeyList = (keyof StandardPropertiesHyphen | string)[];

export function isLazyExoticComponent(value: any): value is LazyExoticComponent<any> {
    return typeof value === "object"
        && value !== null
        && 'load' in value
        && value.$$typeof === Symbol.for('react.lazy');
}

export type StylableElement = Element & { style: CSSStyleDeclaration };

export function isStylableElement(element: any): element is StylableElement {
    return 'style' in element && element.style instanceof CSSStyleDeclaration;
}