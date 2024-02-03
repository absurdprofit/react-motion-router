import React from 'react';
import VideoSrc from '../../assets/video.mp4';
import Thumbnail from "../../assets/thumbnail.png";
import { Anchor, SharedElement, useNavigation } from '@react-motion-router/core';
import BackButton from '../../Components/BackButton';
import './index.css';

export default function Home() {
    const navigation = useNavigation();
    const size = window.screen.availWidth;

    React.useEffect(() => {
        navigation.prefetchRoute('/fullscreen-video');
    }, [navigation]);
    return (
        <div className="video">
            <div className="go-back">
                <BackButton />
            </div>
            <Anchor href='/fullscreen-video'>
                <SharedElement id="video">
                    <video
                        src={VideoSrc}
                        poster={Thumbnail}
                        width={size}
                        style={{
                            objectFit: 'cover',
                            width: size,
                            height: size
                        }}
                        playsInline
                        muted
                        autoPlay
                        loop
                    ></video>
                </SharedElement>
            </Anchor>
        </div>
    );
}