import { PlainObject, useNavigationBase, useRouteBase, useRouterBase } from "@react-motion-router/core";
import { Navigation } from "../Navigation";
import { Router } from "../Router";
import { RouteProp } from "./types";
import { useDebugValue } from "react";

export function useNavigation() {
	useDebugValue("Stack.Navigation");
	return useNavigationBase<Navigation>();
}

export function useRouter() {
	useDebugValue("Stack.Router");
	return useRouterBase<Router>();
}

export function useRoute<T extends PlainObject = PlainObject>() {
	useDebugValue("Stack.Route");
	return useRouteBase<RouteProp<T>>();
}