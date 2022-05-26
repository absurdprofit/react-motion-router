import { Button } from '@mui/material';
import React, { useEffect } from 'react';
import { Anchor, Navigation } from 'react-motion-router';
import '../../css/Overlays.css';

interface OverlaysProps {
    navigation: Navigation;
}

let isLoaded = false;
export default function Overlays({navigation}: OverlaysProps) {
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

    return (
        <div className={`overlays ${isLoaded ? 'loaded' : 'suspense'}`}>
            <Anchor href="/" goBack>Go Back</Anchor>
            <Button onClick={openModal}>Open Modal</Button>
        </div>
    );
}