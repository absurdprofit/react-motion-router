import React from 'react';
import Button from '@mui/material/Button';
import '../css/ListItem.css';

interface ListItemProps {
    title: string;
    description: string;
    onClick: () => void;
}
export default function ListItem(props: ListItemProps) {
    return (
        <Button onClick={props.onClick}>
            <div className="list-item">
                <div className="title">
                    <h2>{props.title}</h2>
                </div>
                <div className="description">
                    <p>{props.description}</p>
                </div>
            </div>
        </Button>
    );
}