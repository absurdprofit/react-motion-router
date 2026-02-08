import {
  PlainObject,
  Anchor as AnchorBase
} from '@react-motion-router/core';
import {
  useEffect,
  useRef,
  useCallback,
  RefObject,
  useImperativeHandle
} from 'react';
import { useNavigation } from './common/hooks';
import { searchParamsFromObject } from './common/utils';
import { DEFAULT_PRELOAD_FORCE_THRESHOLD } from './common/constants';
import { ScreenConfig } from './Screen';

interface OnSightPreloadBehaviour extends UseIntersectionOptions {
  type: 'onsight';
}

interface OnHoverPreloadBehaviour {
  type: 'onhover';
  forceThreshold?: number;
}

interface AnchorProps extends React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> {
  params?: PlainObject<string | boolean | number> | null;
  /**
   * Will override params object if supplied.
   * Used to control the search params that get passed to the href attribute.
   */
  searchParams?: PlainObject<string | boolean | number> | null;
  config?: ScreenConfig;
  preload?: boolean;
  preloadBehaviour?:
    | OnSightPreloadBehaviour
    | OnHoverPreloadBehaviour
    | { type: 'force' };
  rel?: 'next' | 'prev' | (string & {});
  historyEntryKey?: string;
  reload?: boolean;
  replace?: boolean;
  traverse?: boolean;
  children?: React.ReactNode;
}

interface UseIntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}
function useIntersection<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionOptions = {}
) {
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    [callback]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, options);
    const target = targetRef.current;

    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [observerCallback, targetRef, options]);

  return targetRef;
}

type UseHoverOptions = {
  /** Threshold for touch pressure to count as "hover" (0 to 1 range) */
  forceThreshold?: number;
};

type UseHoverCallback = () => void;
function useHover<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  callback: UseHoverCallback,
  { forceThreshold = DEFAULT_PRELOAD_FORCE_THRESHOLD }: UseHoverOptions = {}
) {
  const handleMouseEnter = useCallback(() => callback(), [callback]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch && touch.force >= forceThreshold) {
      callback();
    }
  }, [forceThreshold, callback]);

  useEffect(() => {
    const target = targetRef.current;
    target?.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      return target?.removeEventListener('mouseenter', handleMouseEnter);
    };
  });
  useEffect(() => {
    const target = targetRef.current;
    target?.addEventListener('touchstart', handleTouchStart);

    return () => {
      return target?.removeEventListener('touchstart', handleTouchStart);
    };
  });

  return targetRef;
}

export function Anchor({
  ref: forwardedRef,
  preload,
  params,
  searchParams = params,
  config,
  preloadBehaviour = {
    type: 'onsight',
  },
  children,
  ...props
}: AnchorProps) {
  const navigation = useNavigation();
  const isOnSightPreload = preloadBehaviour?.type === 'onsight' && preload;
  const isOnHoverPreload = preloadBehaviour?.type === 'onhover' && preload;
  const isForcePreload = preloadBehaviour?.type === 'force' && preload;
  const ref = useRef<HTMLAnchorElement>(null);
  params ??= undefined;

  /// Intersection preload behaviour
  useIntersection<HTMLAnchorElement>(
    ref,
    (entry) => {
      if (
        !isOnSightPreload
        || !(entry.target instanceof HTMLAnchorElement)
      ) return;
      navigation.preload(entry.target.href, { params, config });
    },
    isOnSightPreload ? preloadBehaviour : {}
  );
  /// Intersection preload behaviour

  /// Hover preload behaviour
  useHover<HTMLAnchorElement>(
    ref,
    () => {
      if (
        !isOnHoverPreload
        || !ref.current
      ) return;
      navigation.preload(ref.current.href, { params, config });
    },
    isOnHoverPreload ? preloadBehaviour : {}
  );
  /// Hover preload behaviour

  /// Force preload behaviour
  useEffect(() => {
    if (
      !isForcePreload
      || !ref.current
    ) return;
    navigation.preload(ref.current.href, { params, config });
  }, [preload, navigation, config, isForcePreload, params]);
  /// Force preload behaviour

  const routerId = navigation?.routerId;
  const search = searchParams
    ? searchParamsFromObject(searchParams)
    : undefined;

  useImperativeHandle<
    HTMLAnchorElement | null,
    HTMLAnchorElement | null
  >(
    forwardedRef,
    () => ref.current
  );

  return (
    <AnchorBase
      {...props}
      data-router-id={routerId}
      ref={ref}
      search={search}
      navigateState={{
        config,
        params,
      }}
    >
      {children}
    </AnchorBase>
  );
}
