import React, { useEffect, useState } from 'react';
import { useNavigation } from './common/hooks';
import { XOR } from './common/types';
import { searchParamsFromObject } from './common/utils';
import { RouterDataContext } from './RouterData';
import type NavigationBase from './NavigationBase';

interface BaseAnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    params?: {[key:string]: any};
    hash?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

interface ForwardAnchorProps extends BaseAnchorProps {
    href: string;
    replace?: boolean;
}

interface BackAnchorProps extends BaseAnchorProps {
    goBack: boolean;
}

type AnchorProps = XOR<ForwardAnchorProps, BackAnchorProps>;

export default function Anchor(props: AnchorProps) {
    const routerData = React.useContext(RouterDataContext);
    const navigation = useNavigation();
    const [url, setURL] = useState('');
    const [external, setExternal] = useState(false);
    
    useEffect(() => {
        if (!navigation) return;

        let href: string;
        let search: string;
        if ('goBack' in props) {
            href = resolveBackPath(navigation);
            search = '';
        } else {
            const paramsSerializer = routerData?.paramsSerializer || null;
            href = props.href;
            search = searchParamsFromObject(props.params || {}, paramsSerializer) || "";
        }
        const uri = new URL(href, navigation.location.origin);
        uri.hash = props.hash || '';
        uri.search = search;
        if (uri.origin === navigation.location.origin) {
            setExternal(false);
            setURL(uri.href.replace(navigation.location.origin, '')); // pathname with search part
        } else {
            setExternal(true);
            setURL(uri.href);
        }
    }, [props.href, props.params]);
    
    const {href, goBack, hash, onClick: propsOnClick, replace, params, ...aProps} = props;
    const onClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.stopPropagation();
        if (!navigation) return;

        if (!external) e.preventDefault();
        else return;

        if (propsOnClick) propsOnClick(e);
        
        if (goBack) navigation.goBack();
        if (href) navigation.navigate(href, params, {
            hash,
            replace
        }); 
    }

    if (!navigation) return <></>;
    
    return (
        <a
            href={url}
            onClick={onClick}
            {...aProps}
        >{props.children}</a>
    );
}

function resolveBackPath(navigation: NavigationBase): string {
    if (navigation.history.previous) {
        return navigation.history.previous;
    } else {
        if (navigation.parent) {
            return resolveBackPath(navigation.parent);
        } else {
            return document.referrer;
        }
    }
}