import React, { useEffect, useState } from 'react';
import { useNavigation } from './Router';

interface AnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    href: string;
    params?: {[key:string]: any};
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function Anchor(props: AnchorProps) {
    const navigation = useNavigation();
    const [url, setURL] = useState('');
    useEffect(() => {
        const uri = new URL(props.href, navigation.location.origin);
        uri.search = navigation.searchParamsFromObject(props.params || {});
        if (uri.origin === navigation.location.origin) {
            setURL(uri.href.replace(navigation.location.origin, ''));
        } else {
            setURL(uri.href);
        }
    }, [props.href, props.params]);
    
    const {onClick, href, params, ...aProps} = props;
    return(
        <a
            href={url}
            onClick={(e)=>{
                e.preventDefault();
                if(props.onClick) props.onClick(e);
                navigation.navigate(props.href, props.params);  
            }}
            {...aProps}
        >{props.children}</a>
    );
}