import { Button } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Anchor, Motion, Navigation } from 'react-motion-router';
import '../../css/Overlays.css';

interface OverlaysProps {
    navigation: Navigation;
}

let isLoaded = false;
export default function Overlays({navigation}: OverlaysProps) {
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const openModal = () => {
        navigation.navigate('/modal');
    }

    useEffect(() => {
        window.addEventListener('page-animation-end', () => isLoaded = true, {once: true});
        document.body.style.backgroundColor = 'rgba(254, 226, 85)';

        return () => {
            document.body.style.backgroundColor = 'unset';
        }
    });

    useEffect(() => {
        setShouldAnimate(navigation.history.previous === '/overlays');
    }, [navigation.history.previous, navigation.history.next]);
    return (
        <Motion.Consumer>
            {(progress) => {
                return (
                    <div className={`overlays ${isLoaded ? 'loaded' : 'suspense'}`} style={
                        {
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'white',
                            borderRadius: shouldAnimate ? `${15 * (progress/100)}px` : '0px'
                        }
                    }>
                        <Button onClick={openModal}>Open Modal</Button>
                        <Anchor href="/" goBack>Go Back</Anchor>
                    </div>
                );
            }}
        </Motion.Consumer>
    );
}