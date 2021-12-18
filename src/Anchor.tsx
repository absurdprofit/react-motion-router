import React from 'react';
import './css/Anchor.css';

interface AnchorProps {
    children: any;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function Anchor(props: AnchorProps) {
    return(
        <a href={props.href} onClick={(e)=>{
            e.preventDefault();
            if (props.onClick) props.onClick(e)
        }}>{props.children}</a>
    );
}