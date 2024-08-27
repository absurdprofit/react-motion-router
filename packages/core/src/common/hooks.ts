import { useContext, useDebugValue } from "react";
import { MotionContext } from "../MotionContext";
import { NavigationBase } from "../NavigationBase";
import { RouterContext } from "../RouterContext";
import { RoutePropContext } from "../RoutePropContext";
import { RouterBase } from "../RouterBase";
import { RoutePropBase } from "./types";

export function useNavigationBase<T extends NavigationBase = NavigationBase>() {
    const router = useContext(RouterContext);
    if (router) {
        return router.navigation as T;
    } else {
        throw new Error("Router is null. You may be trying to call useNavigation outside a Router.");
    }
}

export function useRouterBase<T extends RouterBase = RouterBase>() {
    return useContext(RouterContext) as T;
}

export function useMotion() {
    useDebugValue("Motion");
    return useContext(MotionContext);
}

export function useRouteBase<R extends RoutePropBase>() {
    const routeProp = useContext(RoutePropContext);
    if (routeProp) {
        return routeProp as R;
    } else {
        throw new Error("Router is null. You may be trying to call useRoute outside a Router.");
    }
}

export function useParamsBase<K extends string, S>(key: K, initialParams: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>] {
	const route = useRouteBase();
	initialParams = initialParams instanceof Function ? initialParams() : initialParams;

	const setParams = (params: S | ((prevState: S) => S)) => {
		if (params instanceof Function)
			params = params(route.params[key] ?? initialParams);
		route.setParams({ [key]: params });
	}

	return [route.params[key] ?? initialParams, setParams] as const;
}