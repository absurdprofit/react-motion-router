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

export interface AnimationFactoryProps<R extends HTMLElement = HTMLElement> {
    ref: R | null;
    index: number;
    exiting: boolean;
    timeline: AnimationTimeline;
    playbackRate: number;
    direction: "normal" | "reverse";
}

export type AnimationFactory<R extends HTMLElement = HTMLElement> = (props: AnimationFactoryProps<R>) => Animation;

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
    preload: () => Promise<{ default: T }>;
    preloaded: T | undefined;
}

export type RoutesData<C extends ScreenBaseProps["config"] = ScreenBaseProps["config"]> = Map<string | undefined, Pick<RouteProp<C, PlainObject>, "config" | "params">>;

export interface RouteProp<C extends ScreenBaseProps["config"], T extends PlainObject> {
    path: string;
    resolvedPathname?: string;
    config: Partial<NonNullable<C>>;
    focused: boolean;
    params: T;
    preloaded: boolean;
    setParams(params: Partial<T>): void;
    setConfig(config: Partial<C>): void;
}
export interface ScreenComponentBaseProps<
    P extends ScreenBaseProps = ScreenBaseProps,
    T extends PlainObject = {},
    N extends NavigationBase = NavigationBase
> {
    route: RouteProp<P["config"], T>;
    navigation: N;
    orientation: ScreenOrientation;
}

export function isValidComponentConstructor(value: any): value is React.ComponentType<any> {
    if (value === null) return false;
    return typeof value === 'function' ||
        (typeof value === 'object' && value.$$typeof === Symbol.for('react.lazy'));
}

export type PlainObject<T = any> = { [key: string]: T };

export interface RouterEventMap {
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

declare global {
    interface HTMLElementEventMap extends RouterEventMap {}
}

export type CustomElementType = string;

export type Input = Record<string, number>;
export type Output = Record<string, number>;
export type Weights = Record<string, number>;
export type LerpRange = { min: Input, max: Input };

export function is1DRange(range: number[] | LerpRange): range is number[] {
    return Array.isArray(range);
}

export interface MatchedRoute {
    exact: boolean;
    params?: PlainObject<string | undefined>;
}

export interface NavigateEventRouterState {
    routerId?: string;
}