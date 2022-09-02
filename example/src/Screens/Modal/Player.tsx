import React, { useEffect, useState } from 'react';
import King from "../../assets/king.webp";
import '../../css/Player.css';
import { SharedElement } from '@react-motion-router/core';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import { lerp } from '../../common/utils';
import { motion } from 'framer-motion';


interface PlayerProps {
    progress: number; // 0 - 1
}

let seekStart = 30;
let volumeStart = 50;
let timeStart = lerp(0, 139, seekStart/100);
export default function Player({progress}: PlayerProps) {
    const [volume, setVolume] = useState(volumeStart - 15);
    const [seekProgress, setSeekProgress] = useState(seekStart - 10);
    const [currentTime, setCurrentTime] = useState(timeStart);

    useEffect(() => {
        setVolume(lerp(volumeStart - 15, volumeStart, progress));
        setSeekProgress(lerp(seekStart - 10, seekStart, progress));
    }, [progress]);

    const handleVolumeChange  = (event: Event, newValue: number | number[]) => {
        setVolume(newValue as number);
        volumeStart = newValue as number;
    };

    const handleSeekChange = (event: Event, newValue: number | number[]) => {
        const time = lerp(0, 139, (newValue as number)) / 100;
        setCurrentTime(time);
        setSeekProgress(newValue as number);
        seekStart = newValue as number;
        timeStart = time;
    };

    return (
        <div className="player">
            <div className="cover-art">
                <SharedElement id="cover-art" config={{
                    easingFunction: 'ease-in'
                }}>
                    <img src={King} alt="cover-art" />
                </SharedElement>
            </div>
            <div className="song-info">
                <SharedElement id="title" config={{
                    easingFunction: 'ease-in'
                }}>
                    <h3 className="title">Modal Sheet Example</h3>
                </SharedElement>
                <motion.h6 className="artiste" style={{opacity: progress}} animate={{
                    x: lerp(-50, 0, progress)
                }}>nxte</motion.h6>
            </div>
            <motion.div className="share" style={{opacity: progress}} animate={{
                y: lerp(50, 0, progress)
            }}>
                <ShareIcon />
            </motion.div>
            <div className="seeker" style={{opacity: progress}}>
                <p className="current-time">{new Date(currentTime * 1000).toISOString().substring(15, 19)}</p>
                <Slider value={seekProgress} onChange={handleSeekChange} style={{
                    width: '70%',
                    transition: 'left 300ms ease-in'
                }} />
                <p className="current-time">2:19</p>
            </div>
            <div className="play-controls">
                <motion.div className="previous" style={{opacity: progress}} animate={{
                    x: lerp(-90, 0, progress),
                }}>
                    <SkipPreviousIcon />
                </motion.div>
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
            <div className="volume" style={{opacity: progress}}>
            <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                <VolumeDownIcon />
                <Slider aria-label="Volume" value={volume} onChange={handleVolumeChange} style={{
                    transition: 'left 300ms ease-in'
                }} />
                <VolumeUpIcon />
            </Stack>
            </div>
        </div>
    );
}