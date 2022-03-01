import React from 'react';

interface AnchorProps {
    children: any;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export default function Anchor(props: AnchorProps) {
    return(
        <a
            href={props.href}
            onClick={(e)=>{
                e.preventDefault();
                if (props.onClick) props.onClick(e)
            }}
            style={{
                color: 'inherit',
                cursor: 'inherit',
                textDecoration: 'none',
                width: 'max-content',
                height: 'max-content',
                display: 'contents'
            }}
        >{props.children}</a>
    );
}