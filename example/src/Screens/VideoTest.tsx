import React from 'react';
import { SharedElement } from 'react-motion-router';
import Video from '../assets/video.mp4';

export default class VideoTest extends React.Component {
    private ref: HTMLVideoElement | null = null;

    onClick = () => {
        (this.props as any).navigation.navigate('/video');
    }

    componentDidMount() {
        if (this.ref) {
            this.ref.currentTime = (window as any).videoTime || 0;
            this.ref.muted = true;
        }
        window.addEventListener('page-animation-end', (e) => {
            if (this.ref) {
                this.ref.muted = false;
            }
        }, {once: true});
        window.addEventListener('navigate', (e) => {
            (window as any).videoTime = this.ref?.currentTime || 0;
        })
    }
    render() {
        return (
            <div className="video-test">
                <SharedElement id="video">
                    <video
                        ref={c => this.ref = c}
                        onClick={this.onClick}
                        src={Video}
                        style={{
                            width: '100vw',
                            height: 'auto',
                            objectFit: 'cover'
                        }}
                        width={640}
                        height={360}
                        loop
                        playsInline
                        autoPlay
                    ></video>
                </SharedElement>
            </div>
        );
    }
}