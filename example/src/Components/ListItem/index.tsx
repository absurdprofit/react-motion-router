import React from 'react';
import Button from '@mui/material/Button';
import './index.css';
import { Anchor } from '@react-motion-router/core';

interface ListItemProps {
    href: string;
    title: string;
    description: string;
}
export default function ListItem(props: ListItemProps) {
    return (
        <li role="menuitem">
            <Anchor href={props.href}>
                <Button tabIndex={-1}>
                    <div className="list-item">
                        <div className="title">
                            <h2>{props.title}</h2>
                        </div>
                        <div className="description">
                            <p>{props.description}</p>
                        </div>
                    </div>
                </Button>
            </Anchor>
        </li>
    );
}