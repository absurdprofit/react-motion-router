import React, {memo} from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import { SharedElement } from 'react-motion-router';
import '../css/Navbar.css';

interface NavbarProps {
    title: string;
    onBack?: React.MouseEventHandler<HTMLButtonElement>;
}
function Navbar(props: NavbarProps) {
    return (
        <div className="navbar">
            <div className="back">
                {
                    props.onBack ?
                    <IconButton onClick={props.onBack}>
                        <SharedElement id="back">
                            <ChevronLeftIcon style={{zIndex: 100}} />
                        </SharedElement>
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

export default memo(Navbar);