import React, { createContext } from 'react';
import AnimationProvider from './AnimationProvider';
import { clamp } from './common/utils';
import { RouterEventMap } from './common/types';

export default class AnimationLayerData {
    private _play: boolean = true;
    private _isPlaying: boolean = false;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _onExit: Function | undefined;
    private _progressUpdateID: number = 0;
    private _pseudoElementInAnimation: Animation | null = null;
    private _pseudoElementOutAnimation: Animation | null = null;
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
            const endTime = this._gestureNavigating ? 0 : 100;
            if (this.progress !== endTime) {
                if (this._onProgress)
                    this._onProgress(endTime);
            }
        };
        Promise.all([
            this._inAnimation?.finished,
            this._outAnimation?.finished,
            this._pseudoElementInAnimation?.finished,
            this._pseudoElementOutAnimation?.finished
        ])
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
        this._inAnimation?.finish();
        this._outAnimation?.finish();
        this._pseudoElementInAnimation?.finish();
        this._pseudoElementOutAnimation?.finish();
    }

    cancel() {
        this._inAnimation?.cancel();
        this._outAnimation?.cancel();
        this._pseudoElementInAnimation?.cancel();
        this._pseudoElementOutAnimation?.cancel();
        this.reset();

        const cancelAnimationEvent = new CustomEvent('page-animation-cancel', {bubbles: true});
        this.dispatchEvent?.(cancelAnimationEvent);
    }

    private cleanUpAnimation(animation: Animation | null) {
        if (!animation) return;
        animation.commitStyles();
        animation.cancel();
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

            this._outAnimation = this._currentScreen.animation;
            this._pseudoElementOutAnimation = this._currentScreen.pseudoElementAnimation;
            this._inAnimation = this._nextScreen.animation;
            this._pseudoElementInAnimation = this._nextScreen.pseudoElementAnimation;

            this._isPlaying = true;
            
            if (this._inAnimation && this._outAnimation) {
                if (!this._shouldAnimate) {
                    this.finish();
                    this._isPlaying = false;
                    this._shouldAnimate = true;
                    return;
                }

                this._inAnimation.playbackRate = this._playbackRate;
                this._outAnimation.playbackRate = this._playbackRate;
                if (this._pseudoElementInAnimation)
                    this._pseudoElementInAnimation.playbackRate = this._playbackRate;
                if (this._pseudoElementOutAnimation)
                    this._pseudoElementOutAnimation.playbackRate = this._playbackRate;
                
                if (this._gestureNavigating) {
                    const inDuration = this._inAnimation.effect?.getTiming().duration || this.duration;
                    const outDuration = this._outAnimation.effect?.getTiming().duration || this.duration;
                    this._inAnimation.currentTime = Number(inDuration);
                    this._outAnimation.currentTime = Number(outDuration);

                    if (this._pseudoElementInAnimation) {
                        const inDuration = this._pseudoElementInAnimation.effect?.getTiming().duration || this.duration;
                        this._pseudoElementInAnimation.currentTime = Number(inDuration);
                    }
                    if (this._pseudoElementOutAnimation) {
                        const outDuration = this._pseudoElementOutAnimation.effect?.getTiming().duration || this.duration;
                        this._pseudoElementOutAnimation.currentTime = Number(outDuration);
                    }
                }

                await Promise.all([
                    this._inAnimation.ready,
                    this._outAnimation.ready,
                    this._pseudoElementInAnimation?.ready,
                    this._pseudoElementOutAnimation?.ready
                ]);
                if (!this._play) {
                    this._inAnimation.pause();
                    this._outAnimation.pause();
                    this._pseudoElementInAnimation?.pause();
                    this._pseudoElementOutAnimation?.pause();
                    this._isPlaying = false;
                } else {
                    this._outAnimation.play();
                    this._inAnimation.play();
                    this._pseudoElementInAnimation?.play();
                    this._pseudoElementOutAnimation?.play();
                }
                const startAnimationEvent = new CustomEvent('page-animation-start', {bubbles: true});
                this.dispatchEvent?.(startAnimationEvent);

                this.updateProgress();

                await Promise.all([
                    this._outAnimation.finished,
                    this._inAnimation.finished,
                    this._pseudoElementInAnimation?.finished,
                    this._pseudoElementOutAnimation?.finished
                ]);
                this.cleanUpAnimation(this._inAnimation);
                this.cleanUpAnimation(this._outAnimation);
                this._inAnimation = null;
                this._outAnimation = null;
                // this.cleanUpAnimation(this._pseudoElementInAnimation);
                // this.cleanUpAnimation(this._pseudoElementOutAnimation);

                this._isPlaying = false;
                const endAnimationEvent = new CustomEvent('page-animation-end', {bubbles: true});
                this.dispatchEvent?.(endAnimationEvent);

                // if playback rate is 2 then gesture navigation was aborted
                if (!this._gestureNavigating || this._playbackRate === 0.5) {
                    this._currentScreen.zIndex = 0;
                    this._nextScreen.zIndex = 1;
                    this._currentScreen.mounted(false); // awaiting causes flicker bug on iOS
                } else {
                    this._nextScreen.zIndex = 0;
                    this._currentScreen.zIndex = 1;
                    await this._nextScreen.mounted(false);
                }
                if (this._onEnd) {
                    this._onEnd();
                }
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
        if (this._pseudoElementInAnimation)
            this._pseudoElementInAnimation.playbackRate = this._playbackRate;
        if (this._pseudoElementOutAnimation)
            this._pseudoElementOutAnimation.playbackRate = this._playbackRate;
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

            if (_play) {
                this._inAnimation?.play();
                this._outAnimation?.play();
                this._pseudoElementInAnimation?.play();
                this._pseudoElementOutAnimation?.play();
            } else {
                this._inAnimation?.pause();
                this._outAnimation?.pause();
                this._pseudoElementInAnimation?.pause();
                this._pseudoElementOutAnimation?.pause();
            }
        }
    }

    set progress(_progress: number) {
        if (this._onProgress) {
            this._onProgress(_progress);
        }
        {
            let inDuration = this._inAnimation?.effect?.getTiming().duration || this.duration;
            const inCurrentTime = (_progress / 100) * Number(inDuration);

            let outDuration = this._outAnimation?.effect?.getTiming().duration || this.duration;
            const outCurrentTime = (_progress / 100) * Number(outDuration);
            if (this._inAnimation && this._outAnimation) {
                this._inAnimation.currentTime = inCurrentTime;
                this._outAnimation.currentTime = outCurrentTime;
            }
        }
        {
            let inDuration = this._pseudoElementInAnimation?.effect?.getTiming().duration || this.duration;
            const inCurrentTime = (_progress / 100) * Number(inDuration);

            let outDuration = this._pseudoElementOutAnimation?.effect?.getTiming().duration || this.duration;
            const outCurrentTime = (_progress / 100) * Number(outDuration);
            if (this._pseudoElementInAnimation)
                this._pseudoElementInAnimation.currentTime = inCurrentTime;
            if (this._pseudoElementOutAnimation) {
                this._pseudoElementOutAnimation.currentTime = outCurrentTime;
            }
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
        const outDuration = this._currentScreen?.duration;
        const inDuration = this._nextScreen?.duration;
        const pseudoElementOutDuration = this._currentScreen?.pseudoElementDuration;
        const pseudoElementInDuration = this._nextScreen?.pseudoElementDuration;
        return Math.max(
            Number(outDuration),
            Number(inDuration),
            Number(pseudoElementOutDuration),
            Number(pseudoElementInDuration)
        ) || 0;
    }

    get progress() {
        const outDuration = this._outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this._inAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementOutDuration = this._pseudoElementOutAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementInDuration = this._pseudoElementInAnimation?.effect?.getComputedTiming().duration;
        const durations = [
            Number(outDuration),
            Number(inDuration),
            Number(pseudoElementInDuration),
            Number(pseudoElementOutDuration)
        ];
        const maxDuration = Math.max(...durations.filter(duration => !isNaN(duration)));
        let progress;
        if (maxDuration === Number(outDuration)) {
            progress = this._outAnimation?.effect?.getComputedTiming().progress;
        } else if (maxDuration === Number(inDuration)) {
            progress = this._inAnimation?.effect?.getComputedTiming().progress;
        } else if (maxDuration === Number(pseudoElementInDuration)) {
            progress = this._pseudoElementInAnimation?.effect?.getComputedTiming().progress;
        } else if (maxDuration === Number(pseudoElementOutDuration)) {
            progress = this._pseudoElementOutAnimation?.effect?.getComputedTiming().progress;
        }
        return (Number(progress) || 0) * 100;
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

    get ready() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await Promise.all([
                    this._outAnimation?.ready,
                    this._inAnimation?.ready,
                    this._pseudoElementInAnimation?.ready,
                    this._pseudoElementOutAnimation?.ready
                ]);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    get finished() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await Promise.all([
                    this._outAnimation?.finished,
                    this._inAnimation?.finished,
                    this._pseudoElementInAnimation?.finished,
                    this._pseudoElementOutAnimation?.finished
                ]);
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