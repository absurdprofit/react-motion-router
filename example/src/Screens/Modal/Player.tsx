import React, { useState } from 'react';
import King from "../../assets/king.webp";
import '../../css/Player.css';
import { SharedElement } from 'react-motion-router';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { lerp } from '../../common/utils';

export default function Player() {
    const [volume, setVolume] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const handleVolumeChange  = (event: Event, newValue: number | number[]) => {
        setVolume(newValue as number);
    };

    const handleSeekChange = (event: Event, newValue: number | number[]) => {
        setCurrentTime(newValue as number);
    };
    return (
        <div className="player">
            <div className="cover-art">
                <SharedElement id="cover-art">
                    <img src={King} alt="cover-art" />
                </SharedElement>
            </div>
            <div className="song-info">
                <SharedElement id="title">
                    <h6 className="title">Modal Sheet Example</h6>
                </SharedElement>
                <h6 className="artiste">nxte</h6>
            </div>
            <div className="share">
                <ShareIcon />
            </div>
            <div className="seeker">
                <p className="current-time">{new Date(lerp(0, 1399, currentTime)).toISOString().substring(15, 19)}</p>
                <Slider value={currentTime} onChange={handleSeekChange} style={{
                    width: '70%'
                }} />
                <p className="current-time">2:19</p>
            </div>
            <div className="play-controls">
                <div className="previous">
                    <SkipPreviousIcon />
                </div>
                <div className="play">
                    <SharedElement id="play">
                        <PlayArrowIcon />
                    </SharedElement>
                </div>
                <div className="next">
                    <SharedElement id="next">
                        <SkipNextIcon />
                    </SharedElement>
                </div>
            </div>
            <div className="volume">
            <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                <VolumeDownIcon />
                <Slider aria-label="Volume" value={volume} onChange={handleVolumeChange} />
                <VolumeUpIcon />
            </Stack>
            </div>
        </div>
    );
}