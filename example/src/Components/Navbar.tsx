import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import '../css/Navbar.css';

interface NavbarProps {
    title: string;
    on_back?: React.MouseEventHandler<HTMLButtonElement>;
}
export default function Navbar(props: NavbarProps) {
    return (
        <div className="navbar">
            <div className="back">
                {
                    props.on_back ?
                    <IconButton onClick={props.on_back}>
                        <ChevronLeftIcon />
                    </IconButton>
                    :
                    undefined
                }
            </div>
            <div className="title">
                <h2>{props.title}</h2>
            </div>
        </div>
    );
}