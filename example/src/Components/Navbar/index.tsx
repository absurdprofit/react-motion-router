import React, { memo } from 'react';
import { SharedElement, useNavigation, useRoute } from '@react-motion-router/core';
import './index.css';
import BackButton from '../BackButton';
import { Navigation } from '@react-motion-router/stack';

interface NavbarProps {
    title: string;
}
function Navbar(props: NavbarProps) {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();

    return (
        <SharedElement id="navbar" config={{
            type: 'fade'
        }}>
            <div className="navbar">
                <div className="back">
                    {
                        navigation.canGoBack ?
                            <BackButton />
                            :
                            undefined
                    }
                </div>
                <div className="title">
                    <SharedElement id={props.title.toLowerCase().split(' ').join('-') + "-title"} config={{ transformOrigin: 'center center' }}>
                        <h2>{props.title}</h2>
                    </SharedElement>
                </div>
            </div>
        </SharedElement>
    );
}

export default memo(Navbar);