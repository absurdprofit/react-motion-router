import React, { createContext } from 'react';
import AnimationProvider from './AnimationProvider';
import { clamp } from './common/utils';
import AnimationKeyframePresets from './Animations';
import { RouterEventMap } from './common/types';

export default class AnimationLayerData {
    private _play: boolean = true;
    private _isPlaying: boolean = false;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _onExit: Function | undefined;
    private _progressUpdateID: number = 0;
    private _inAnimation: Animation | null = null;
    private _outAnimation: Animation | null = null;
    private _playbackRate: number = 1;
    private _gestureNavigating: boolean = false;
    private _backNavigating: boolean = false;
    private _onEnd: Function | null = null;
    private _onProgress: ((progress: number) => void) | null = null;
    private _shouldAnimate: boolean = true;
    private _dispatchEvent: ((event: Event) => Promise<boolean>) | null = null;
    private _addEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void) | null = null

    private updateProgress() {
        if (this._gestureNavigating && !this._play) {
            // update in set progress() instead
            window.cancelAnimationFrame(this._progressUpdateID);
            return;
        }
        const update = () => {
            if (this._onProgress) {
                this._onProgress(this.progress);
            }
        }

        update();

        this._progressUpdateID = window.requestAnimationFrame(this.updateProgress.bind(this));
        const onEnd = () => {
            window.cancelAnimationFrame(this._progressUpdateID);
            if (this.progress !== 100) {
                if (this._onProgress)
                    this._onProgress(100);
            }
        };
        Promise.all([this._inAnimation?.finished, this._outAnimation?.finished])
        .then(onEnd)
        .catch(onEnd);
    }

    reset() {
        this._onEnd = null;
        this._playbackRate = 1;
        this._play = true;
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
            this.reset();

            const cancelAnimationEvent = new CustomEvent('page-animation-cancel', {bubbles: true});
            this.dispatchEvent?.(cancelAnimationEvent);
        }
    }

    async animate() {
        if (this._isPlaying) {
            // cancel playing animation
            this.cancel();
            if (this._onEnd) this._onEnd();
            this.reset();
        }
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            if (this._gestureNavigating) {
                await this._currentScreen.mounted(true);
            } 

            if (this._backNavigating) {
                this._currentScreen.zIndex = 1;
                this._nextScreen.zIndex = 0;
            } else {
                this._currentScreen.zIndex = 0;
                this._nextScreen.zIndex = 1;
            }

            if (this._onProgress) this._onProgress(this.progress);

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
            }
            if (Array.isArray(this._nextScreen.inAnimation)) { // predefined animation
                const [animation, duration, userDefinedEasingFunction] = this._nextScreen.inAnimation;
                this._inAnimation = this._nextScreen.animate(AnimationKeyframePresets[animation], {
                    fill: 'both',
                    duration: duration,
                    easing: userDefinedEasingFunction || easingFunction
                });
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
            }

            this._isPlaying = true;
            
            const startAnimationEvent = new CustomEvent('page-animation-start', {bubbles: true});
            this.dispatchEvent?.(startAnimationEvent);

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
                    let inDuration = this._inAnimation.effect?.getTiming().duration || this.duration;

                    let outDuration = this._outAnimation.effect?.getTiming().duration || this.duration;
                    this._inAnimation.currentTime = Number(inDuration);
                    this._outAnimation.currentTime = Number(outDuration);
                }

                if (!this._play) {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                    this._isPlaying = false;
                }

                await Promise.all([this._inAnimation.ready, this._outAnimation.ready]);

                this.updateProgress();

                await Promise.all([this._outAnimation.finished, this._inAnimation.finished]);
                if (this._inAnimation) {
                    this._inAnimation.commitStyles();
                    this._inAnimation.cancel();
                    this._inAnimation = null;
                }
                if (this._outAnimation) {
                    this._outAnimation.commitStyles();
                    this._outAnimation.cancel();
                    this._outAnimation = null;
                }
                // if playback rate is 2 then gesture navigation was aborted
                if (!this._gestureNavigating || this._playbackRate === 0.5) {
                    this._currentScreen.zIndex = 0;
                    this._nextScreen.zIndex = 1;
                    if (this._currentScreen)
                        this._currentScreen.mounted(false); // awaiting causes flicker bug on iOS
                } else {
                    this._nextScreen.zIndex = 0;
                    this._currentScreen.zIndex = 1;
                    if (this._nextScreen)
                        await this._nextScreen.mounted(false);
                }
                if (this._onEnd) {
                    this._onEnd();
                }
                this._isPlaying = false;
                const endAnimationEvent = new CustomEvent('page-animation-end', {bubbles: true});
                this.dispatchEvent?.(endAnimationEvent);
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

    set backNavigating(_backNavigating: boolean) {
        this._backNavigating = _backNavigating;
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
        if (this._onProgress) {
            this._onProgress(_progress);
        }
        let inDuration = this._inAnimation?.effect?.getTiming().duration || this.duration;
        const inCurrentTime = (_progress / 100) * Number(inDuration);

        let outDuration = this._outAnimation?.effect?.getTiming().duration || this.duration;
        const outCurrentTime = (_progress / 100) * Number(outDuration);
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

    set addEventListener(_addEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined)=> void) | null) {
        this._addEventListener = _addEventListener;
    }

    set dispatchEvent(_dispatchEvent: ((event: Event) => Promise<boolean>) | null) {
        this._dispatchEvent = _dispatchEvent;
    }

    get addEventListener() {
        return this._addEventListener;
    }

    get dispatchEvent() {
        return this._dispatchEvent;
    }

    get duration() {
        const outDuration = this._outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this._inAnimation?.effect?.getComputedTiming().duration;
        if (Number(outDuration) > Number(inDuration)) {
            return Number(outDuration) || 0;
        }
        return Number(inDuration) || 0;
    }

    get animation() {
        const outDuration = this._outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this._inAnimation?.effect?.getComputedTiming().duration;
        if (Number(outDuration) > Number(inDuration)) {
            return this._outAnimation;
        }
        return this._inAnimation;
    }

    get progress() {
        const outDuration = this._outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this._inAnimation?.effect?.getComputedTiming().duration;
        let progress;
        if (Number(outDuration) > Number(inDuration)) {
            progress = this._outAnimation?.effect?.getComputedTiming().progress;
        } else {
            progress = this._inAnimation?.effect?.getComputedTiming().progress;
        }
        return Number(progress);
    }

    get gestureNavigating() {
        return this._gestureNavigating;
    }

    get backNavigating() {
        return this._backNavigating;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    get finished() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await Promise.all([this._outAnimation?.finished, this._inAnimation?.finished]);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    get started() {
        return new Promise<void>(async (resolve) => {
            this.addEventListener?.('page-animation-start', () => {
                resolve();
            }, {once: true});
        });
    }
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());