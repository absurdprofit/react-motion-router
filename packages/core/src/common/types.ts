import { isValidElement } from 'react';
import { ScreenBase, ScreenBaseProps } from '../ScreenBase';
import {
    MotionProgressEndEvent,
    MotionProgressEvent,
    MotionProgressStartEvent,
    TransitionCancelEvent,
    TransitionEndEvent,
    TransitionStartEvent
} from './events';
import { SharedElement } from '../SharedElement';
import { StandardPropertiesHyphen } from 'csstype';

export type ScreenChild<E extends ScreenBase = ScreenBase> = E extends ScreenBase<infer P> ? React.CElement<P, E> : never;

export interface AnimationEffectFactoryProps<R extends HTMLElement = HTMLElement> {
    ref: R | null;
    index: number;
    exiting: boolean;
    timeline: AnimationTimeline | null;
    playbackRate: number;
    direction: PlaybackDirection;
}

export type AnimationEffectFactory<R extends HTMLElement = HTMLElement> = (props: AnimationEffectFactoryProps<R>) => AnimationEffect;

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

export function isValidScreenChild<S extends ScreenBase>(value: any): value is ScreenChild<S> {
    if (!isValidElement(value)) return false;
    return Object.getPrototypeOf(value.type) === ScreenBase;
}

export type PlainObject<T = any> = { [key: string]: T };

export interface RouterBaseEventMap extends HTMLElementEventMap {
    "transition-start": TransitionStartEvent;
    "transition-cancel": TransitionCancelEvent;
    "transition-end": TransitionEndEvent;
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
    params?: PlainObject<string | undefined>;
}

export interface PathPattern {
    pattern: string;
    caseSensitive: boolean;
}

export type AnimationDirection = "normal" | "reverse";

enum SharedElementTransitionTypeEnum {
    "morph",
    "fade-through",
    "fade",
    "cross-fade"
}

export type SharedElementTransitionType = keyof typeof SharedElementTransitionTypeEnum;

export interface SharedElementNode {
    id: string;
    instance: SharedElement;
}

export type SharedElementNodeMap = Map<string, SharedElementNode>;

export type StyleKeyList = (keyof StandardPropertiesHyphen | string)[];

export function isNativeLazyExoticComponent(value: any): value is React.LazyExoticComponent<any> {
    return typeof value === "object"
        && value !== null
        && value.$$typeof === Symbol.for('react.lazy');
}

export function isLazyExoticComponent(value: any): value is LazyExoticComponent<any> {
    return isNativeLazyExoticComponent(value) && 'load' in value;
}

export type StylableElement = Element & { style: CSSStyleDeclaration };

export function isStylableElement(element: any): element is StylableElement {
    return 'style' in element && element.style instanceof CSSStyleDeclaration;
}

export interface ScreenBaseFocusOptions {
    signal?: AbortSignal;
}

export interface LoadNavigationTransition extends Omit<NavigationTransition, "navigationType"> {
    navigationType: "load";
}

declare global {
    interface NavigateEvent extends Event {
        commit(): void;
    }
}

export type ElementPropType<C> = C extends React.CElement<infer P, infer T> ? P & React.ClassAttributes<T> : never;
export type ClonedElementType<C, IP extends Partial<ElementPropType<C>>> = C extends React.CElement<infer P, infer T> ? React.CElement<P & Partial<IP>, T & React.Component<P & IP>> : never;