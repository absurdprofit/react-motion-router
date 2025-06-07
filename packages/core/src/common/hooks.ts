import { useCallback, useContext, useDebugValue, useEffect, useRef, useSyncExternalStore } from 'react';
import { NavigationBase } from '../NavigationBase';
import { RouterContext } from '../RouterContext';
import { RoutePropContext } from '../RoutePropContext';
import { RouterBase } from '../RouterBase';
import { RoutePropBase } from './types';
import { ScreenTransitionLayerContext } from '../ScreenTransitionLayerContext';

export function useNavigationBase<T extends NavigationBase = NavigationBase>() {
  const router = useContext(RouterContext);
  if (router) {
    return router.navigation as T;
  } else {
    throw new Error('Router is null. You may be trying to call useNavigation outside a Router.');
  }
}

export function useRouterBase<T extends RouterBase = RouterBase>() {
  return useContext(RouterContext) as T;
}

export function useMotion() {
  useDebugValue('Motion');
  const router = useContext(RouterContext);
  const screenTransitionLayer = useContext(ScreenTransitionLayerContext);
  const animation = screenTransitionLayer
    .animation;
  
  const defaultProgress = 1;
  // use sync external store to get animation progress
  // on animation frame
  return useSyncExternalStore(
    (callback) => {
      return router.addEventListener('transition-start', async () => {
        do {
          await new Promise<number>(resolve => {
            requestAnimationFrame(resolve);
          });
          callback();
        } while (animation.playState === 'running');
      });
    },
    () => {
      const { progress } = animation
        ?.effect
        ?.getComputedTiming() ?? {};
      return progress ?? defaultProgress;
    }
  );
}


export function useRouteBase<R extends RoutePropBase>() {
  const routeProp = useContext(RoutePropContext);
  if (routeProp) {
    return routeProp as R;
  } else {
    throw new Error('Router is null. You may be trying to call useRoute outside a Router.');
  }
}

export function useParamsBase<K extends string, S>(key: K, initialParams: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>] {
  const route = useRouteBase();
  const initial = initialParams instanceof Function ? initialParams() : initialParams;

  const routeRef = useRef(route);
  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  const setParam = useCallback((param: S | ((prevState: S) => S)) => {
    const { params, setParams } = routeRef.current;
    if (param instanceof Function)
      param = param(params[key] ?? initial);
    setParams({ [key]: param });
  }, [initial, key]);

  const param = route.params[key];

  return [param ?? initial, setParam] as const;
}