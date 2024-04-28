import { useContext, useDebugValue } from "react";
import { Motion } from "../ScreenTransitionLayer";
import { NavigationBase } from "../NavigationBase";
import { ScreenBaseProps } from "../ScreenBase";
import { RouteData, PlainObject } from './types';
import { RouterContext } from "../RouterContext";
import { RouteDataContext } from "../RouteData";
import { RouterBase } from "../RouterBase";

export function useNavigation<T extends NavigationBase = NavigationBase>() {
    useDebugValue("Navigation");
    const router = useContext(RouterContext);
    if (router) {
        return router.navigation as T;
    } else {
        throw new Error("Router is null. You may be trying to call useNavigation outside a Router.");
    }
}

export function useRouter<T extends RouterBase = RouterBase>() {
    useDebugValue("Router");
    return useContext(RouterContext) as T;
}

export function useMotion() {
    useDebugValue("Motion");
    return useContext(Motion);
}

export function useRoute<P extends ScreenBaseProps, T extends PlainObject>(): RouteData<P, T> {
    useDebugValue("Route");
    const routeData = useContext(RouteDataContext);
    if (routeData) {
        return routeData as RouteData<P, T>;
    } else {
        throw new Error("Router is null. You may be trying to call useRoute outside a Router.");
    }
}