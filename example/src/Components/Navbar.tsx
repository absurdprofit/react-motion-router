import React, {memo} from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import IconButton from '@mui/material/IconButton';
import { SharedElement, useNavigation } from 'react-motion-router';
import '../css/Navbar.css';

interface NavbarProps {
    title: string;
    backButton?: boolean;
}
function Navbar(props: NavbarProps) {
    const navigation = useNavigation();
    
    const onClick = () => {
        navigation.goBack();
    }
    return (
        <div className="navbar">
            <div className="back">
                {
                    props.backButton ?
                    <IconButton onClick={onClick}>
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