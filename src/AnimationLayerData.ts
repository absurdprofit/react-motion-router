import React, {createContext} from 'react';
import AnimationProvider from './AnimationProvider';
import { clamp } from './common/utils';
import AnimationKeyframePresets from './Animations';

export default class AnimationLayerData {
    private _progress: number = 0;
    private _play: boolean = true;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _onExit: Function | undefined;
    private _progressUpdateID: number = 0;
    private _duration: number = 0;
    private _inAnimation: Animation | undefined;
    private _outAnimation: Animation | undefined;
    private _playbackRate: number = 1;
    private _gestureNavigating: boolean = false;
    private _onEnd: Function | null = null;
    private _onProgress: Function | null = null;
    private _shouldAnimate: boolean = true;

    private updateProgress() {
        
        if (this._gestureNavigating && !this._play) {
            // update in set progress() instead
            window.cancelAnimationFrame(this._progressUpdateID);
            return;
        }
        const update = () => {
            const currentTime = this._outAnimation?.currentTime || 0;
            const progress = clamp((currentTime / this._duration) * 100, 0, 100);

            this._progress = progress;

            if (this._onProgress) {
                this._onProgress(this._progress);
            }
        }

        update();

        this._progressUpdateID = window.requestAnimationFrame(this.updateProgress.bind(this));
        this._outAnimation?.finished.then(() => {
            window.cancelAnimationFrame(this._progressUpdateID);
            if (this._progress !== 100) {
                update();
            }
        });
    }

    reset() {
        this._onEnd = null;
        this._playbackRate = 1;
        this._play = true;
        this._progress = 0;
        this._gestureNavigating = false;
    }

    finish() {
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.finish();
            this._outAnimation.finish();
        }
    }

    cancel() {
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.cancel();
            this._outAnimation.cancel();
        }
    }

    async animate() {
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            if (this._gestureNavigating) {
                await this._currentScreen.mounted(true);
            } 

            // failing to call _onExit to disable SETs
            if (this._onExit && this._shouldAnimate) this._onExit();
            await this._nextScreen.mounted(true);

            let easingFunction = 'ease-out';
            if (this._gestureNavigating) easingFunction = 'linear';
            this._outAnimation = this._currentScreen.animate(AnimationKeyframePresets[this._currentScreen.outAnimation as keyof typeof AnimationKeyframePresets], {
                fill: 'forwards',
                duration: this._duration,
                easing: easingFunction
            });
            this._inAnimation = this._nextScreen.animate(AnimationKeyframePresets[this._nextScreen.inAnimation as keyof typeof AnimationKeyframePresets], {
                fill: 'forwards',
                duration: this._duration,
                easing: easingFunction
            });

            if (this._inAnimation && this._outAnimation) {
                if (!this._shouldAnimate) {
                    this._inAnimation.finish();
                    this._outAnimation.finish();
                    this._shouldAnimate = true;
                    return;
                }

                this._inAnimation.playbackRate = this._playbackRate;
                this._outAnimation.playbackRate = this._playbackRate;
                
                if (this._gestureNavigating) {
                    this._inAnimation.currentTime = this._duration;
                    this._outAnimation.currentTime = this._duration;
                }

                if (!this._play) {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                }

                this._outAnimation.ready.then(() => {
                    this.updateProgress();
                });
                this._outAnimation.onfinish = () => {
                    if (this._outAnimation) {
                        this._outAnimation.onfinish = null;
                    }
                    // if playback rate is 2 then gesture navigation was aborted
                    if (!this._gestureNavigating || this._playbackRate === 0.5) {
                        if (this._currentScreen) {
                            this._currentScreen.mounted(false);
                        }
                    } else {
                        if (this._currentScreen) {
                            // hotfix for weird bug that snaps screen to start position after gesture navigation
                            this._currentScreen.animate([
                                {transform: 'translate(0vw, 0vh) scale(1)', opacity: 1}
                            ], {duration: 0, fill: 'forwards'});
                        }
                        if (this._nextScreen) {
                            this._nextScreen.mounted(false);
                        }
                    }
                    if (this._onEnd) {
                        this._onEnd();
                    }

                    const endAnimationEvent = new CustomEvent('page-animation-end');
                    window.dispatchEvent(endAnimationEvent);
                }
            }
        } else {
            this._shouldAnimate = true;
        }
    }

    set onProgress(_onProgress: Function | null) {
        this._onProgress = _onProgress;
    }

    set onEnd(_onEnd: Function | null) {
        this._onEnd = _onEnd;
    }

    set shouldAnimate(_shouldAnimate: boolean)  {
        this._shouldAnimate = _shouldAnimate;
    }

    set playbackRate(_playbackRate: number) {
        this._playbackRate = _playbackRate;
        if (_playbackRate > 0) {
            // aborted gesture navigation so set pointer events back to correct setting
            if (this._currentScreen && this._nextScreen) {
            }
        }
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.playbackRate = this._playbackRate;
            this._outAnimation.playbackRate = this._playbackRate;
        }
    }

    set gestureNavigating(_gestureNavigating: boolean) {
        this._gestureNavigating = _gestureNavigating;
    }

    set play(_play: boolean) {
        if (this._play !== _play) {
            this._play = _play;

            if (this._play && this._gestureNavigating) {
                this.updateProgress();
            }

            if (this._inAnimation && this._outAnimation) {
                if (_play) {
                    this._inAnimation.play();
                    this._outAnimation.play();
                } else {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                }
            }
        }
    }

    set progress(_progress: number) {
        this._progress = _progress;
        if (this._onProgress) {
            this._onProgress(this._progress);
        }
        const currentTime = (this._progress / 100) * this._duration;
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.currentTime = currentTime;
            this._outAnimation.currentTime = currentTime;
        }
    }

    set currentScreen(_screen: AnimationProvider) {
        this._currentScreen = _screen;
    }

    set nextScreen(_screen: AnimationProvider) {
        this._nextScreen = _screen;
        if (!this._currentScreen) {
            _screen.mounted(true, false);
            this._nextScreen = null;
        }
    }

    set onExit(_onExit: Function | undefined) {
        this._onExit = _onExit;
    }

    set duration(_duration: number) {
        this._duration = _duration;
    }
    get progress() {
        return this._progress;
    }

    get gestureNavigating() {
        return this._gestureNavigating;
    }
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());