import { NavigationBaseOptions, NavigationBaseProps, PlainObject } from "@react-motion-router/core";
import { ScreenProps } from "../Screen";

export interface NavigateOptions extends NavigationBaseOptions {
	type?: "push" | "replace";
}

export interface GoBackOptions extends NavigationBaseOptions { }
export interface GoForwardOptions extends NavigationBaseOptions { }

export interface NavigationProps extends NavigationBaseProps<PlainObject, ScreenProps["config"]> {}

export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

export type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

export interface NavigateEventRouterState {
	config?: ScreenProps["config"];
	params?: PlainObject;
}
