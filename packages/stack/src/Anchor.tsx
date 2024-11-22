import { PlainObject } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { NavigateOptions, XOR } from './common/types';
import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { useNavigation } from './common/hooks';
import { searchParamsFromObject } from './common/utils';
import { DEFAULT_PRELOAD_FORCE_THRESHOLD } from './common/constants';

interface BaseAnchorProps
  extends React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > {
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  navigation?: Navigation | null;
}

interface OnSightPreloadBehaviour extends UseIntersectionOptions {
  type: 'onsight';
}

interface OnHoverPreloadBehaviour {
  type: 'onhover';
  forceThreshold?: number;
}

interface ForwardAnchorProps extends BaseAnchorProps {
  params?: PlainObject<string | boolean | number>;
  href: string;
  type?: NavigateOptions['type'];
  preload?: boolean;
  preloadBehaviour?:
    | OnSightPreloadBehaviour
    | OnHoverPreloadBehaviour
    | { type: 'force' };
}

interface BackAnchorProps extends BaseAnchorProps {
  goBack: boolean;
}

type AnchorProps = XOR<ForwardAnchorProps, BackAnchorProps>;

function useNavigationOrDefault(navigation?: Navigation | null) {
  const defaultNavigation = useNavigation();
  return navigation ?? defaultNavigation;
}

interface UseIntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}
function useIntersection<T extends HTMLElement>(
  callback: (entry: IntersectionObserverEntry) => void,
  options: UseIntersectionOptions = {}
) {
  const targetRef = useRef<T>(null);

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
    const element = targetRef.current;

    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [observerCallback, options]);

  return targetRef;
}

type EventListenerOptions = boolean | AddEventListenerOptions;

function useEventListener<K extends keyof HTMLElementEventMap>(
  ref: RefObject<HTMLElement>,
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: EventListenerOptions
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener(eventName, handler, options);

    return () => {
      element.removeEventListener(eventName, handler, options);
    };
  }, [ref, eventName, handler, options]);
}

type UseHoverOptions = {
  forceThreshold?: number; // Threshold for touch pressure to count as "hover" (0 to 1 range)
};

type UseHoverCallback = (isHovered: boolean) => void;
function useHover<T extends HTMLElement>(
  hoverCallback: UseHoverCallback,
  { forceThreshold = DEFAULT_PRELOAD_FORCE_THRESHOLD }: UseHoverOptions = {}
) {
  const targetRef = useRef<T | null>(null);

  const handleMouseEnter = () => hoverCallback(true);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch && touch.force >= forceThreshold) {
      hoverCallback(true);
    }
  };

  useEventListener(targetRef, 'mouseenter', handleMouseEnter);
  useEventListener(targetRef, 'touchstart', handleTouchStart);

  return targetRef;
}

export function Anchor({
  preload,
  goBack,
  params = {},
  type = 'push',
  href: hrefProp,
  navigation: navigationProp,
  onClick: onClickProp,
  preloadBehaviour = {
    type: 'onsight',
  },
  children,
  ...aProps
}: AnchorProps) {
  const navigation = useNavigationOrDefault(navigationProp);
  const isOnSightPreload = preloadBehaviour?.type === 'onsight';
  const isOnHoverPreload = preloadBehaviour?.type === 'onhover';
  const isForcePreload = preloadBehaviour?.type === 'force';

  /// Intersection preload behaviour
  const intersectionRef = useIntersection<HTMLAnchorElement>(
    (entry) => {
      if (!entry.isIntersecting || !preload) return;
      navigation.preload(hrefProp, { params });
    },
    isOnSightPreload ? preloadBehaviour : {}
  );
  /// Intersection preload behaviour

  /// Hover preload behaviour
  const hoverRef = useHover<HTMLAnchorElement>(
    (hovered) => {
      if (!hovered || !preload) return;
      navigation.preload(hrefProp, { params });
    },
    isOnHoverPreload ? preloadBehaviour : {}
  );
  /// Hover preload behaviour

  /// Force preload behaviour
  useEffect(() => {
    if (!preload || !isForcePreload) return;
    navigation.preload(hrefProp, { params });
  }, [preload, hrefProp, navigation, isForcePreload, params]);
  /// Force preload behaviour

  const [href, setHref] = useState<string | undefined>(undefined);
  const routerId = navigation?.routerId;
  const isExternal = !href?.includes(window.location.origin);
  const rel = isExternal ? 'noopener noreferrer' : goBack ? 'prev' : 'next';

  useEffect(() => {
    if (goBack && navigation.canGoBack()) {
      setHref(navigation.previous.url?.href);
    } else if (hrefProp) {
      const search = searchParamsFromObject(params);
      const uri = new URL(hrefProp, navigation.baseURL);
      uri.search = search;
      setHref(uri.href);
    }
  }, [hrefProp, params, navigation, goBack]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (goBack) {
      e.preventDefault();
      navigation.goBack();
    } else if (type === 'replace' && hrefProp) {
      e.preventDefault();
      navigation.replace(hrefProp);
    }
    onClickProp?.(e);
  };

  let ref;
  switch (preloadBehaviour?.type) {
    case 'onhover':
      ref = hoverRef;
      break;
    case 'onsight':
      ref = intersectionRef;
      break;
    default:
      ref = null;
  }

  return (
    <a
      href={href}
      data-router-id={routerId}
      onClick={onClick}
      rel={rel}
      ref={ref}
      {...aProps}
    >
      {children}
    </a>
  );
}
