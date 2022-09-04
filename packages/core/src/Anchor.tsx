import React, { useEffect, useState } from 'react';
import { useNavigation } from './common/hooks';
import { XOR } from './common/types';

interface BaseAnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    params?: {[key:string]: any};
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

interface ForwardAnchorProps extends BaseAnchorProps {
    href: string;
}

interface BackAnchorProps extends BaseAnchorProps {
    goBack: boolean;
}

type AnchorProps = XOR<ForwardAnchorProps, BackAnchorProps>;

export default function Anchor(props: AnchorProps) {
    const navigation = useNavigation();
    const [url, setURL] = useState('');
    const [external, setExternal] = useState(false);
    
    useEffect(() => {
        if (!navigation) return;

        let href;
        let search;
        if ('goBack' in props) {
            href = navigation.history.previous || navigation.history.defaultRoute;
            search = '';        
        } else {
            href = props.href;
            search = navigation.searchParamsFromObject(props.params || {});
        }
        const uri = new URL(href, navigation.location.origin);
        uri.search = search;
        if (uri.origin === navigation.location.origin) {
            setExternal(false);
            setURL(uri.href.replace(navigation.location.origin, '')); // pathname with search part
        } else {
            setExternal(true);
            setURL(uri.href);
        }
    }, [props.href, props.params]);
    
    const {params, ...aProps} = props;
    const onClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (!navigation) return;
        
        if (props.onClick) props.onClick(e);

        if (!external) e.preventDefault();
        else return;

        if ('goBack' in props) navigation.goBack();
        else navigation.navigate(props.href, params); 
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