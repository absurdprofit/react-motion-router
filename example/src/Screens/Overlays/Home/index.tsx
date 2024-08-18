import { Button, IconButton } from '@mui/material';
import React, { useRef } from 'react';
import { SharedElement } from '@react-motion-router/core';
import { ScreenComponentProps, Anchor, Navigation } from '@react-motion-router/stack';
import King from "../../../assets/king.webp";
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import './index.css';

interface HomeProps extends ScreenComponentProps { }

export default function Home({ navigation }: HomeProps) {
    const playerRef = useRef<HTMLDivElement | null>(null);

    const openPlayer = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        navigation.navigate('player').finished.catch(console.log);
    }

    return (
        <>
            <div className="go-back">
                <Anchor goBack navigation={navigation.parent as Navigation}>
                    <IconButton disableRipple>
                        <ArrowBackIosIcon style={{ zIndex: 100 }} />
                    </IconButton>
                </Anchor>
            </div>
            <div className="modal-example" style={{ marginBlockStart: "100px" }}>
                <Anchor href="sheet">
                    <Button>Open Modal</Button>
                </Anchor>
            </div>
            <div className="player" onClick={openPlayer} ref={playerRef}>
                <div className="info">
                    <div className="cover-art">
                        <SharedElement id="cover-art" config={{
                            easing: 'ease-out'
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
                            easing: 'ease-out'
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
        </>
    );
}