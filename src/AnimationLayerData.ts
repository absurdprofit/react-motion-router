import React, {createContext} from 'react';
import AnimationProvider from './AnimationProvider';
import { clamp } from './common/utils';
import AnimationKeyframePresets from './Animations';

export default class AnimationLayerData {
    private _progress: number = 0;
    private _play: boolean = true;
    private _isPlaying: boolean = false;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _onExit: Function | undefined;
    private _progressUpdateID: number = 0;
    private _duration: number = 0;
    private _inAnimation: Animation | null = null;
    private _outAnimation: Animation | null = null;
    private _playbackRate: number = 1;
    private _gestureNavigating: boolean = false;
    private _onEnd: Function | null = null;
    private _onProgress: ((progress: number) => void) | null = null;
    private _shouldAnimate: boolean = true;

    private updateProgress() {
        if (this._gestureNavigating && !this._play) {
            // update in set progress() instead
            window.cancelAnimationFrame(this._progressUpdateID);
            return;
        }
        const update = () => {
            const currentTime = this._inAnimation?.currentTime  || 0;
            const progress = clamp((currentTime / this._duration) * 100, 0, 100);

            this._progress = progress;

            if (this._onProgress) {
                this._onProgress(this._progress);
            }
        }

        update();

        this._progressUpdateID = window.requestAnimationFrame(this.updateProgress.bind(this));
        this._inAnimation?.finished.then(() => {
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
        if (this._isPlaying) {
            if (!this._gestureNavigating) {
                // cancel playing animation
                this.finish();
                if (this._onEnd) this._onEnd();
                if (this._nextScreen) await this._nextScreen.mounted(true);
                return;
            } else {
                cancelAnimationFrame(this._progressUpdateID);
                [this._outAnimation, this._inAnimation] = [this._inAnimation, this._outAnimation];
                if (!this._play) {
                    this._inAnimation?.pause();
                    this._outAnimation?.pause();
                    this._isPlaying = false;
                }
                return;
            }
        }
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            if (this._gestureNavigating) {
                await this._currentScreen.mounted(true);
            } 

            // failing to call _onExit to disable SETs
            if (this._onExit && this._shouldAnimate) this._onExit();
            await this._nextScreen.mounted(true);

            let easingFunction = this._gestureNavigating ? 'linear' : 'ease-out';
            if (Array.isArray(this._currentScreen.outAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this._currentScreen.outAnimation;
                this._outAnimation = this._currentScreen.animate(AnimationKeyframePresets[animation], {
                    fill: 'both',
                    duration: duration,
                    easing: userDefinedEasingFunction || easingFunction
                });
                if (this._gestureNavigating) this._duration = duration;
            } else { // user provided animation
                let {keyframes, options} = this._currentScreen.outAnimation;
                if (typeof options === "number") {
                    options = {
                        duration: options,
                        easing: easingFunction,
                        fill: 'both'
                    };
                } else {
                    options = {
                        ...options,
                        easing: options?.easing || easingFunction,
                        duration: options?.duration || this.duration,
                        fill: options?.fill || 'both'
                    };
                }
                this._outAnimation = this._currentScreen.animate(keyframes, options);
                if (this._gestureNavigating) {
                    let duration = this._outAnimation?.effect?.getTiming().duration;
                    if (typeof duration === "string") duration = parseFloat(duration);
                    this._duration = duration || this._duration;
                }
            }
            if (Array.isArray(this._nextScreen.inAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this._nextScreen.inAnimation;
                this._inAnimation = this._nextScreen.animate(AnimationKeyframePresets[animation], {
                    fill: 'both',
                    duration: duration,
                    easing: userDefinedEasingFunction || easingFunction
                });
                if (!this.gestureNavigating) this._duration = duration;
            } else { // user provided animation
                let {keyframes, options} = this._nextScreen.inAnimation;
                if (typeof options === "number") {
                    options = {
                        duration: options,
                        easing: easingFunction,
                        fill: 'both'
                    };
                } else {
                    options = {
                        ...options,
                        fill: options?.fill || 'both',
                        duration: options?.duration || this.duration,
                        easing: options?.easing || easingFunction
                    };
                }
                this._inAnimation = this._nextScreen.animate(keyframes, options);
                if (!this._gestureNavigating) {
                    let duration = this._inAnimation?.effect?.getTiming().duration;
                    if (typeof duration === "string") duration = parseFloat(duration);
                    this._duration = duration || this._duration;
                }
            }

            this._isPlaying = true;
            
            const startAnimationEvent = new CustomEvent('page-animation-start');
            window.dispatchEvent(startAnimationEvent);

            if (this._inAnimation && this._outAnimation) {
                if (!this._shouldAnimate) {
                    this.finish();
                    this._isPlaying = false;
                    this._shouldAnimate = true;
                    return;
                }

                this._inAnimation.playbackRate = this._playbackRate;
                this._outAnimation.playbackRate = this._playbackRate;
                
                if (this._gestureNavigating) {
                    let inDuration = this._inAnimation.effect?.getTiming().duration || this._duration;
                    if (typeof inDuration === "string") inDuration = parseFloat(inDuration);

                    let outDuration = this._outAnimation.effect?.getTiming().duration || this._duration;
                    if (typeof outDuration === "string") outDuration = parseFloat(outDuration);
                    this._inAnimation.currentTime = inDuration;
                    this._outAnimation.currentTime = outDuration;
                }

                if (!this._play) {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                    this._isPlaying = false;
                }

                await Promise.all([this._inAnimation.ready, this._outAnimation.ready])
                this.updateProgress();

                await Promise.all([this._outAnimation.finished, this._inAnimation.finished])
                if (this._inAnimation) {
                    this._inAnimation.commitStyles();
                    this._inAnimation.cancel();
                    this._inAnimation = null;
                }
                if (this._outAnimation) {
                    this._outAnimation.commitStyles();
                    this._outAnimation.cancel();
                    this._outAnimation.onfinish = null;
                    this._outAnimation = null;
                }
                // if playback rate is 2 then gesture navigation was aborted
                if (!this._gestureNavigating || this._playbackRate === 0.5) {
                    if (this._currentScreen)
                        this._currentScreen.mounted(false);
                } else {
                    if (this._nextScreen)
                        await this._nextScreen.mounted(false);
                }
                if (this._onEnd) {
                    this._onEnd();
                }
                this._isPlaying = false;
                const endAnimationEvent = new CustomEvent('page-animation-end');
                window.dispatchEvent(endAnimationEvent);
            }
        } else {
            this._shouldAnimate = true;
        }
    }

    set onProgress(_onProgress: ((progress: number) => void) | null) {
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
        let inDuration = this._inAnimation?.effect?.getTiming().duration || this._duration;
        if (typeof inDuration === "string") inDuration = parseFloat(inDuration);
        const inCurrentTime = (this._progress / 100) * inDuration;

        let outDuration = this._outAnimation?.effect?.getTiming().duration || this._duration;
        if (typeof outDuration === "string") outDuration = parseFloat(outDuration);
        const outCurrentTime = (this._progress / 100) * outDuration;
        if (this._inAnimation && this._outAnimation) {
            this._inAnimation.currentTime = inCurrentTime;
            this._outAnimation.currentTime = outCurrentTime;
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

    get duration() {
        return this._duration;
    }

    get progress() {
        return this._progress;
    }

    get gestureNavigating() {
        return this._gestureNavigating;
    }
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());