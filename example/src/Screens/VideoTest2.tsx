import React from 'react';
import { SharedElement } from 'react-motion-router';
import Video from '../assets/video.mp4';


export default class VideoTest2 extends React.Component {
    private ref: HTMLVideoElement | null = null;

    componentDidMount() {
        if (this.ref) {
            this.ref.currentTime = (window as any).videoTime;
            this.ref.muted = true;
        }
        window.addEventListener('page-animation-end', (e) => {
            if (this.ref) {
                this.ref.muted = false;
            }
        }, {once: true});
    }
    render() {
        return (
            <div className="video-test">
                <SharedElement id="video">
                    <video ref={c => this.ref = c} src={Video} style={{height: '100vh', width: '100vw', objectFit: 'cover'}} playsInline loop></video>
                </SharedElement>
            </div>
        );
    }
}