import React, { useEffect, useState } from 'react';
import King from "../../../assets/king.webp";
import { Motion, SharedElement, useMotion } from '@react-motion-router/core';
import { Stack } from '@react-motion-router/stack';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import VolumeDownIcon from '@mui/icons-material/VolumeDown';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Slider from '@mui/material/Slider';
import StackComponent from '@mui/material/Stack';
import { motion } from 'framer-motion';
import { lerp } from '../../../common/utils';
import '../../../css/Player.css';

export interface PlayerParams {
    top: number;
}

interface PlayerProps extends Stack.ScreenComponentProps<PlayerParams> {}

let seekStart = 30;
let volumeStart = 50;
let timeStart = lerp(0, 139, seekStart/100);
let isFirstLoad = true;
const transition = {
    type: 'tween',
    duration: 0,
    ease: 'linear'
}
export default function Player({navigation, route}: PlayerProps) {
    const progress = useMotion();
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

    const [disabled, setDisabled] = useState(false);

    const onClose = async (ev: React.MouseEvent<HTMLDialogElement | HTMLButtonElement, MouseEvent>) => {
        ev.stopPropagation();

        if (disabled) return;
        for (let target of ev.nativeEvent.composedPath()) {
            const {classList} = target as HTMLElement;
            if ('classList' in target)
                if (classList.contains('modal')) return;
                else if (classList.contains('close')) break;
                else continue;
        }

        await navigation.goBack();

        setDisabled(true);
    }

    const {top} = route.params;
    const y = top || 92;
    return (
        <dialog
            open
            className={`modal-presentation ${isFirstLoad ? 'loaded' : 'suspense'}`}
            onClick={onClose}
        >
            <Motion.Consumer>
                {(progress) => {
                    progress = progress / 100; // in the range 0 - 1
                    return (
                        <div
                            className="modal"
                            style={{
                                transform: `translateY(15vh)`,
                                borderRadius: `${lerp(0, 15, progress)}px`
                            }}
                        >
                            <div className="notch" style={{opacity: lerp(0, 1, progress)}}></div>
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
                                <StackComponent spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                                    <VolumeDownIcon />
                                    <Slider aria-label="Volume" value={volume} onChange={handleVolumeChange} style={{
                                        transition: 'left 300ms ease-in'
                                    }} />
                                    <VolumeUpIcon />
                                </StackComponent>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </Motion.Consumer>
        </dialog>
        
    );
}