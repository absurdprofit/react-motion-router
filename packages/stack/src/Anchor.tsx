import { searchParamsFromObject, useNavigation, PlainObject, RouterDataContext } from "@react-motion-router/core";
import { Navigation } from "./Navigation";
import { NavigateOptions, XOR } from "./common/types";
import { useContext, useState, useEffect } from "react";

interface BaseAnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    navigation?: Navigation;
}

interface ForwardAnchorProps extends BaseAnchorProps {
    params?: PlainObject;
    href: string;
    type?: NavigateOptions["type"];
    preload?: boolean;
}

interface BackAnchorProps extends BaseAnchorProps {
    goBack: boolean;
}

type AnchorProps = XOR<ForwardAnchorProps, BackAnchorProps>;

export function Anchor(props: AnchorProps) {
    const {
        navigation = useNavigation<Navigation>(),
        preload,
        goBack,
        params = {},
        type = "push",
        href: hrefProp,
        onClick: onClickProp,
        ...aProps
    } = props;
    const routerData = useContext(RouterDataContext);
    const [href, setHref] = useState<string | undefined>(undefined);
    const routerId = navigation?.routerId;
    const isExternal = !href?.includes(window.location.origin);
    const rel = isExternal ? "noopener noreferrer" : goBack ? "prev" : "next";

    useEffect(() => {
        if (!preload || !href) return;
        navigation.preloadRoute(new URL(href).pathname);
    }, [preload, href]);

    useEffect(() => {
        if (goBack) {
            setHref(navigation.previous?.url?.href ?? undefined);
        } else if (hrefProp) {
            const paramsSerializer = routerData?.paramsSerializer || null;
            const search = searchParamsFromObject(params, paramsSerializer);
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
            navigation.navigate(hrefProp, { params }, { type });
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