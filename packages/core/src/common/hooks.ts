import { useContext, useDebugValue } from "react";
import { Motion } from "../MotionContext";
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
    return useContext(Motion);
}

export function useRouteBase<R extends RoutePropBase>() {
    const routeProp = useContext(RoutePropContext);
    if (routeProp) {
        return routeProp as R;
    } else {
        throw new Error("Router is null. You may be trying to call useRoute outside a Router.");
    }
}