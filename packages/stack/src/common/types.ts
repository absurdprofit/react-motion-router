import { PlainObject, RoutePropBase, RouterBaseEventMap } from "@react-motion-router/core";
import { ScreenProps } from "../Screen";
import { RefObject } from "react";
import { BackEvent, ForwardEvent, GestureCancelEvent, GestureEndEvent, GestureStartEvent, NavigateEvent } from "./events";

export interface NavigationBaseOptions {
	signal?: AbortSignal;
}

export interface NavigateOptions extends NavigationBaseOptions {
	type?: "push" | "replace";
}

export interface GoBackOptions extends NavigationBaseOptions { }
export interface GoForwardOptions extends NavigationBaseOptions { }

export interface NavigationProps {
	params?: Record<any, any>;
	config?: ScreenProps["config"]
}

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export interface HistoryEntryState {
	config?: ScreenProps["config"];
	params?: PlainObject;
}

export function isRefObject<T>(value?: React.LegacyRef<T>): value is RefObject<T> {
	if (
		value !== null
		&& typeof value === 'object'
		&& value.hasOwnProperty('current')
	) return true;
	return false;
}

export interface RouterEventMap extends RouterBaseEventMap {
	"navigate": NavigateEvent;
	"back": BackEvent;
	"forward": ForwardEvent;
	"gesture-start": GestureStartEvent;
	"gesture-end": GestureEndEvent;
	"gesture-cancel": GestureCancelEvent;
}

export interface RouteProp<T extends PlainObject = {}> extends RoutePropBase<ScreenProps["config"], T> { }

export type SwipeDirection = 'up' | 'down' | 'left' | 'right' | 'horizontal' | 'vertical';

export function isVerticalDirection(direction: SwipeDirection): direction is 'up' | 'down' | 'vertical' {
	return direction === 'up' || direction === 'down' || direction === 'vertical';
}

export function isHorizontalDirection(direction: SwipeDirection): direction is 'left' | 'right' | 'horizontal' {
	return direction === 'left' || direction === 'right' || direction === 'horizontal';
}