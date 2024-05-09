import { PlainObject, RoutePropBase, RouterBaseEventMap } from "@react-motion-router/core";
import { ScreenProps } from "../Screen";
import { RefObject } from "react";
import { BackEvent, ForwardEvent, NavigateEvent } from "./events";

interface NavigationBaseOptions {
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
	routerIds?: string[];
}

export function isRefObject<T>(value: React.LegacyRef<T>): value is RefObject<T> {
	if (
		value !== null
		&& typeof value === 'object'
		&& value.hasOwnProperty('current')
	) return true;
	return false;
}

export interface StackRouterEventMap extends RouterBaseEventMap {
	"navigate": NavigateEvent;
	"back": BackEvent;
	"forward": ForwardEvent;
}

export interface RouteProp extends RoutePropBase<ScreenProps["config"]> {}

export type SwipeDirection = 'up' | 'down' | 'left' | 'right' | 'horizontal' | 'vertical';
