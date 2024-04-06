import { NavigationBaseOptions, NavigationBaseProps, PlainObject } from "@react-motion-router/core";
import { ScreenProps } from "../Screen";

export interface NavigateOptions extends NavigationBaseOptions {
	type?: "push" | "replace";
	hash?: string;
}

export interface GoBackOptions extends NavigationBaseOptions { }

export interface NavigationProps extends NavigationBaseProps<PlainObject, ScreenProps["config"]> {}