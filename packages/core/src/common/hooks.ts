import { useContext, useState } from "react";
import { Motion } from "../ScreenTransitionLayer";
import { NavigationBase } from "../NavigationBase";
import { ScreenBaseProps } from "../ScreenBase";
import { RouteData, PlainObject } from './types';
import { RouterContext } from "../RouterContext";
import { RouteDataContext } from "../RouteData";
import { RouterBase } from "../RouterBase";

export function useReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const [prefersReducedMotion, setPreference] = useState(mediaQuery.matches);

    const onPreferenceChange = () => {
        setPreference(mediaQuery.matches);
    };

    mediaQuery.onchange = onPreferenceChange;

    return prefersReducedMotion;
}

export function useNavigation<T extends NavigationBase = NavigationBase>() {
    const router = useContext(RouterContext);
    if (router) {
        return router.navigation as T;
    } else {
        throw new Error("Router is null. You may be trying to call useNavigation outside a Router.");
    }
}

export function useRouter<T extends RouterBase = RouterBase>() {
    return useContext(RouterContext) as T;
}

export function useMotion() {
    return useContext(Motion);
}

export function useRoute<P extends ScreenBaseProps, T extends PlainObject>(): RouteData<P, T> {
    const routeData = useContext(RouteDataContext);
    if (routeData) {
        return routeData as RouteData<P, T>;
    } else {
        throw new Error("Router is null. You may be trying to call useRoute outside a Router.");
    }
}