import React, {memo} from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import IconButton from '@mui/material/IconButton';
import { Anchor, SharedElement } from '@react-motion-router/core';
import '../css/Navbar.css';

interface NavbarProps {
    title: string;
    backButton?: boolean;
}
function Navbar(props: NavbarProps) {
    
    return (
        <div className="navbar">
            <div className="back">
                {
                    props.backButton ?
                    <Anchor goBack>
                        <IconButton disableRipple>
                            <SharedElement id="back">
                                <ArrowBackIosIcon style={{zIndex: 100}} />
                            </SharedElement>
                        </IconButton>
                    </Anchor>
                    :
                    undefined
                }
            </div>
            <div className="title">
                <SharedElement id={props.title.toLowerCase().split(' ').join('-') + "-title"} config={{transformOrigin: 'center center'}}>
                    <h2>{props.title}</h2>
                </SharedElement>
            </div>
        </div>
    );
}

export default memo(Navbar);