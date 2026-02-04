import { Button, IconButton } from '@mui/material';
import React, { useRef } from 'react';
import { SharedElement } from '@react-motion-router/core';
import { ScreenComponentProps, Anchor, Navigation } from '@react-motion-router/stack';
import King from '../../../assets/king.webp';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import './index.css';

interface HomeProps extends ScreenComponentProps { }

export default function Home({ navigation }: HomeProps) {
  const playerRef = useRef<HTMLDivElement | null>(null);

  const openPlayer = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    navigation.navigate('player').finished.catch(console.log);
  };

  return (
    <>
      <div className="go-back">
        <Anchor traverse>
          <IconButton disableRipple>
            <ArrowBackIosIcon style={{ zIndex: 100 }} />
          </IconButton>
        </Anchor>
      </div>
      <div className="modal-example" style={{ marginBlockStart: '100px' }}>
        <Anchor href="sheet">
          <Button>Open Modal</Button>
        </Anchor>
      </div>
      <div className="player" onClick={openPlayer} ref={playerRef}>
        <div className="info">
          <div className="cover-art">
            <SharedElement.img src={King} alt="" id="cover-art" config={{
              easing: 'ease-out',
            }} />
          </div>
          <div className="title">
            <SharedElement.h6 id="title" config={{
              type: 'fade-through',
            }}>
              Modal Sheet Example
            </SharedElement.h6>
          </div>
        </div>
        <div className="play-controls">
          <div className="play">
            <SharedElement.div id="play" config={{
              easing: 'ease-out',
            }}>
              <PlayArrowIcon />
            </SharedElement.div>
          </div>
          <div className="next">
            <SharedElement.div id="next">
              <SkipNextIcon />
            </SharedElement.div>
          </div>
        </div>
      </div>
    </>
  );
}