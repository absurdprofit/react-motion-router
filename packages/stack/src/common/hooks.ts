import { useNavigationBase, useRouteBase, useRouterBase } from "@react-motion-router/core";
import { Navigation } from "../Navigation";
import { Router } from "../Router";
import { RouteProp } from "./types";
import { useDebugValue } from "react";

export function useNavigation() {
	useDebugValue("StackNavigation");
	return useNavigationBase<Navigation>();
}

export function useRouter() {
	useDebugValue("StackRouter");
	return useRouterBase<Router>();
}

export function useRoute() {
	useDebugValue("StackRoute");
	return useRouteBase<RouteProp>();
}