import { PlainObject } from "@react-motion-router/core";
import { Navigation } from "./Navigation";
import { NavigateOptions, XOR } from "./common/types";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigation } from "./common/hooks";
import { searchParamsFromObject } from "./common/utils";

interface BaseAnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    navigation?: Navigation | null;
}

interface OnSightPreloadBehaviour extends UseIntersectionOptions {
    type: 'onsight';
}

interface OnHoverPreloadBehaviour {
    type: 'onhover'
}

interface ForwardAnchorProps extends BaseAnchorProps {
    params?: PlainObject<string | boolean | number>;
    href: string;
    type?: NavigateOptions["type"];
    preload?: boolean;
    preloadBehaviour?: OnSightPreloadBehaviour | OnHoverPreloadBehaviour | { type: 'force' };
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
};
function useIntersection<T extends HTMLElement>(callback: (entry: IntersectionObserverEntry) => void, options: UseIntersectionOptions = {}) {
    const targetRef = useRef<T>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
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

export function Anchor(props: AnchorProps) {
    const {
        preload,
        goBack,
        params = {},
        type = "push",
        href: hrefProp,
        onClick: onClickProp,
        preloadBehaviour,
        ...aProps
    } = props;
    const navigation = useNavigationOrDefault(props.navigation);
    const isOnSightPreload = preloadBehaviour?.type === 'onsight';
    const isOnHoverPreload = preloadBehaviour?.type === 'onhover';
    const isForcePreload = preloadBehaviour?.type === 'force';

    /// Intersection preload behaviour
    const ref = useIntersection<HTMLAnchorElement>((entry) => {
        if (!entry.isIntersecting) return;
        if (!preload) return;
        navigation.preload(hrefProp, { params });
    }, isOnSightPreload ? preloadBehaviour : {});
    /// Intersection preload behaviour

    /// Force preload behaviour
    useEffect(() => {
        if (!preload) return;
        if (!isForcePreload) return;
        navigation.preload(hrefProp, { params });
    }, [preload, hrefProp]);
    /// Force preload behaviour

    const [href, setHref] = useState<string | undefined>(undefined);
    const routerId = navigation?.routerId;
    const isExternal = !href?.includes(window.location.origin);
    const rel = isExternal ? "noopener noreferrer" : goBack ? "prev" : "next";

    useEffect(() => {
        if (goBack) {
            setHref(navigation.previous?.url?.href);
        } else if (hrefProp) {
            const search = searchParamsFromObject(params);
            const uri = new URL(hrefProp, navigation.baseURL);
            uri.search = search;
            setHref(uri.href);
        }
    }, [hrefProp, params]);

    const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (goBack) {
            e.preventDefault();
            navigation.goBack();
        } else if (type === "replace" && hrefProp) {
            e.preventDefault();
            navigation.replace(hrefProp);
        }
        onClickProp?.(e);
    };

    return (
        <a
            href={href}
            data-router-id={routerId}
            onClick={onClick}
            rel={rel}
            ref={isOnSightPreload ? ref : null}
            {...aProps}
        >
            {props.children}
        </a>
    );
}