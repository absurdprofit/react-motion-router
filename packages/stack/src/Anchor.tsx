import { PlainObject } from "@react-motion-router/core";
import { Navigation } from "./Navigation";
import { NavigateOptions, XOR } from "./common/types";
import { useState, useEffect } from "react";
import { useNavigation } from "./common/hooks";
import { searchParamsFromObject } from "./common/utils";

interface BaseAnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    navigation?: Navigation;
}

interface ForwardAnchorProps extends BaseAnchorProps {
    params?: PlainObject<string | boolean | number>;
    href: string;
    type?: NavigateOptions["type"];
    preload?: boolean;
}

interface BackAnchorProps extends BaseAnchorProps {
    goBack: boolean;
}

type AnchorProps = XOR<ForwardAnchorProps, BackAnchorProps>;

function useNavigationOrDefault(navigation?: Navigation) {
    const defaultNavigation = useNavigation();
    return navigation ?? defaultNavigation;
}

export function Anchor(props: AnchorProps) {
    const {
        preload,
        goBack,
        params = {},
        type = "push",
        href: hrefProp,
        onClick: onClickProp,
        ...aProps
    } = props;
    const navigation = useNavigationOrDefault(props.navigation);
    const [href, setHref] = useState<string | undefined>(undefined);
    const routerId = navigation?.routerId;
    const isExternal = !href?.includes(window.location.origin);
    const rel = isExternal ? "noopener noreferrer" : goBack ? "prev" : "next";

    useEffect(() => {
        if (!preload || !href) return;
        navigation.preloadRoute(hrefProp);
    }, [preload, hrefProp]);

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
            {...aProps}
        >
            {props.children}
        </a>
    );
}