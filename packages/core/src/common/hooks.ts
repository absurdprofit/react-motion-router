import { useContext, useDebugValue } from "react";
import { Motion } from "../ScreenTransitionLayer";
import { NavigationBase } from "../NavigationBase";
import { ScreenBaseProps } from "../ScreenBase";
import { RouterContext } from "../RouterContext";
import { RoutePropContext } from "../RouteProp";
import { RouterBase } from "../RouterBase";
import { RouteProp } from "..";

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

export function useRouteBase<R extends RouteProp>() {
    const routeProp = useContext(RoutePropContext);
    if (routeProp) {
        return routeProp as R;
    } else {
        throw new Error("Router is null. You may be trying to call useRoute outside a Router.");
    }
}