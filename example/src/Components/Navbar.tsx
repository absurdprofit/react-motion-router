import React, {memo} from 'react';
import { SharedElement, useNavigation } from '@react-motion-router/core';
import '../css/Navbar.css';
import BackButton from './BackButton';

interface NavbarProps {
    title: string;
}
function Navbar(props: NavbarProps) {
    const navigation = useNavigation();
    return (
        <div className="navbar">
            <div className="back">
                {
                    navigation.canGoBack() ?
                    <BackButton />
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