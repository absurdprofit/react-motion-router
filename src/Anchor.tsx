import React, { useEffect, useState } from 'react';
import { useNavigation } from './Router';

interface AnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    href: string;
    params?: {[key:string]: any};
    goBack?: boolean;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function Anchor(props: AnchorProps) {
    const navigation = useNavigation();
    const [url, setURL] = useState('');
    
    useEffect(() => {
        let href;
        let search;
        if (props.goBack) {
            href = navigation.history.previous || navigation.history.defaultRoute;
            search = '';        
        } else {
            href = props.href;
            search = navigation.searchParamsFromObject(props.params || {});
        }
        const uri = new URL(href, navigation.location.origin);
        uri.search = search;
        if (uri.origin === navigation.location.origin) {
            setURL(uri.href.replace(navigation.location.origin, '')); // pathname with search part
        } else {
            setURL(uri.href);
        }
    }, [props.href, props.params]);
    
    const {onClick, href, params, goBack, ...aProps} = props;
    return (
        <a
            href={url}
            onClick={(e)=>{
                e.preventDefault();
                if (onClick) onClick(e);

                if (goBack) navigation.goBack();
                else navigation.navigate(href, params);  
            }}
            {...aProps}
        >{props.children}</a>
    );
}