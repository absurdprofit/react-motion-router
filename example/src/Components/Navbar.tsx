import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import '../css/Navbar.css';

interface NavbarProps {
    title: string;
    onBack?: React.MouseEventHandler<HTMLButtonElement>;
}
export default function Navbar(props: NavbarProps) {
    return (
        <div className="navbar">
            <div className="back">
                {
                    props.onBack ?
                    <IconButton onClick={props.onBack}>
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