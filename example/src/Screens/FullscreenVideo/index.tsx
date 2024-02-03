import React, { useEffect } from "react";
import { SharedElement } from "@react-motion-router/core";
import VideoSrc from '../../assets/video.mp4';
import Thumbnail from "../../assets/thumbnail.png";
import BackButton from "../../Components/BackButton";
import './index.css';

export default function Video() {
    const ref = React.useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.setAttribute('muted', 'true');
        }
    }, []);
    const toggleMute = () => {
        if (ref.current) ref.current.muted = !ref.current.muted;
    }
    return (
        <div className="fullscreen-video">
            <div className="go-back">
                <BackButton />
            </div>
            <SharedElement id="video">
                <video
                    ref={ref}
                    onClick={toggleMute}
                    src={VideoSrc}
                    poster={Thumbnail}
                    width={window.screen.availWidth}
                    height={window.screen.availHeight}
                    style={{
                        width: window.screen.availWidth,
                        height: window.screen.availHeight
                    }}
                    playsInline
                    muted
                    autoPlay
                    loop
                ></video>
            </SharedElement>
        </div>
    );
}