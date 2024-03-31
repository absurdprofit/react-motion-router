import { useContext, useEffect, useState } from 'react';
import { useNavigation } from './common/hooks';
import { PlainObject, XOR } from './common/types';
import { searchParamsFromObject } from './common/utils';
import { RouterDataContext } from './RouterData';
import type { NavigationBase } from './NavigationBase';
import { NavigateOptions } from './NavigationBase';

interface BaseAnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    navigation?: NavigationBase;
}

interface ForwardAnchorProps extends BaseAnchorProps {
    params?: PlainObject;
    href: string;
    type?: NavigateOptions["type"];
}

interface BackAnchorProps extends BaseAnchorProps {
    goBack: boolean;
}

type AnchorProps = XOR<ForwardAnchorProps, BackAnchorProps>;

export function Anchor(props: AnchorProps) {
    const { navigation = useNavigation(), goBack, params = {}, type = "push", href: hrefProp, onClick: onClickProp, ...aProps } = props;
    const routerData = useContext(RouterDataContext);
    const [href, setHref] = useState<string | undefined>(undefined);
    const routerId = navigation?.routerId;

    useEffect(() => {
        if (goBack) {
            setHref(navigation.previous?.url ?? undefined);
        } else if (hrefProp) {
            const paramsSerializer = routerData?.paramsSerializer || null;
            const search = searchParamsFromObject(params, paramsSerializer);
            const uri = new URL(hrefProp.replace(/^\//, ''), navigation.baseURL);
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
            {...aProps}
        >
            {props.children}
        </a>
    );
}