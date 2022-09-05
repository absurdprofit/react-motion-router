import { Button } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import { Anchor, SharedElement } from '@react-motion-router/core';
import { Navigation } from '@react-motion-router/stack';
import King from "../../assets/king.webp";
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import '../../css/Overlays.css';

interface OverlaysProps {
    navigation: Navigation;
}

let isLoaded = false;
export default function Overlays({navigation}: OverlaysProps) {
    const playerRef = useRef<HTMLDivElement | null>(null);
    const openModal = () => {

        navigation.navigate('/modal', {
            sheetView: false
        });
    }

    const openSheet = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        let top = 0.9 * window.innerHeight;
        if (playerRef.current) top = playerRef.current.getBoundingClientRect().top + (0.05 * window.innerHeight);
        
        navigation.navigate('/modal', {
            sheetView: true,
            top: (top / window.innerHeight) * 100 // vh units
        });
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
            <div className="go-back">
                <Anchor goBack>Go Back</Anchor>
            </div>
            <div className="modal-example">
                <Button onClick={openModal}>Open Modal</Button>
            </div>
            <div className="player" onClick={openSheet} ref={playerRef}>
                <div className="info">
                    <div className="cover-art">
                        <SharedElement id="cover-art" config={{
                            easingFunction: 'ease-out'
                        }}>
                            <img src={King} alt="" />
                        </SharedElement>
                    </div>
                    <div className="title">
                        <SharedElement id="title" config={{
                            type: 'fade-through'
                        }}>
                            <h6>Modal Sheet Example</h6>
                        </SharedElement>
                    </div>
                </div>
                <div className="play-controls">
                    <div className="play">
                        <SharedElement id="play" config={{
                            easingFunction: 'ease-out'
                        }}>
                            <PlayArrowIcon />
                        </SharedElement>
                    </div>
                    <div className="next">
                        <SharedElement id="next">
                            <SkipNextIcon />
                        </SharedElement>
                    </div>
                </div>
            </div>
        </div>
    );
}