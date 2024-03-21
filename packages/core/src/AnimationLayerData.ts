import { createContext } from 'react';
import AnimationProvider from './AnimationProvider';
import { getAnimationDuration, interpolate } from './common/utils';
import { RouterEventMap } from './common/types';
import { MAX_NORM_PROGRESS, MAX_PROGRESS, MIN_NORM_PROGRESS, MIN_PROGRESS } from './common/constants';
import GhostLayer from './GhostLayer';

export default class AnimationLayerData {
    private _play: boolean = true;
    private _isPlaying: boolean = false;
    private _isStarted = false;
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
    private _ghostLayer: GhostLayer | null = null;
    private _onEnd: Function | null = null;
    private _onProgress: ((progress: number) => void) | null = null;
    private _shouldAnimate: boolean = true;
    private _dispatchEvent: ((event: Event) => Promise<boolean>) | null = null;
    private _addEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void) | null = null;

    private updateProgress() {
        if (this._gestureNavigating && !this._play) {
            // update in set progress() instead
            window.cancelAnimationFrame(this._progressUpdateID);
            return;
        }

        if (this._onProgress)
            this._onProgress(this.progress);

        this._progressUpdateID = window.requestAnimationFrame(this.updateProgress.bind(this));
    }

    private finishProgress() {
        if (this._onProgress)
            this._onProgress(this.progress);
        window.cancelAnimationFrame(this._progressUpdateID);
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

    private removeAnimations() {
        this._inAnimation?.commitStyles();
        this._outAnimation?.commitStyles();
        this._inAnimation = null;
        this._outAnimation = null;
        this._pseudoElementInAnimation = null;
        this._pseudoElementOutAnimation = null;
    }

    async setupTransition() {
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            if (this._gestureNavigating) {
                await this._currentScreen.mounted(true);
            } 

            if (this._onProgress) this._onProgress(this.progress);

            // failing to call _onExit to disable SETs
            if (this._onExit && this._shouldAnimate) this._onExit();
            await this._nextScreen.mounted(true);
        }
    }

    async pageTransition() {
        if (this._isPlaying) {
            // cancel playing animation
            this.cancel();
            if (this._onEnd) this._onEnd();
            this.reset();
        }
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            this._outAnimation = this._currentScreen.animation;
            this._pseudoElementOutAnimation = this._currentScreen.pseudoElementAnimation;
            this._inAnimation = this._nextScreen.animation;
            this._pseudoElementInAnimation = this._nextScreen.pseudoElementAnimation;
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
                    const inDuration = getAnimationDuration(this._inAnimation, this.duration);
                    const outDuration = getAnimationDuration(this._outAnimation, this.duration);
                    this._inAnimation.currentTime = inDuration;
                    this._outAnimation.currentTime = outDuration;

                    if (this._pseudoElementInAnimation) {
                        const inDuration = getAnimationDuration(this._pseudoElementInAnimation, this.duration);
                        this._pseudoElementInAnimation.currentTime = inDuration;
                    }
                    if (this._pseudoElementOutAnimation) {
                        const outDuration = getAnimationDuration(this._pseudoElementOutAnimation, this.duration);
                        this._pseudoElementOutAnimation.currentTime = outDuration;
                    }
                }

                await this.ready;

                this._isPlaying = true;
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
                this._isStarted = true;
                const startAnimationEvent = new CustomEvent('page-animation-start', {bubbles: true});
                this.dispatchEvent?.(startAnimationEvent);

                this.updateProgress();

                await this.finished.finally(this.finishProgress.bind(this));

                this.removeAnimations();

                this._isPlaying = false;
                const endAnimationEvent = new CustomEvent('page-animation-end', {bubbles: true});
                this.dispatchEvent?.(endAnimationEvent);

                // if playback rate is 2 then gesture navigation was aborted
                if (!this._gestureNavigating || this._playbackRate === 0.5) {
                    this._currentScreen.mounted(false); // awaiting causes flicker bug on iOS
                } else {
                    await this._nextScreen.mounted(false);
                }
                if (this._onEnd) {
                    this._onEnd();
                }
                this._isStarted = false;
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
            let inDuration = getAnimationDuration(this._inAnimation, this.duration);
            const inCurrentTime = interpolate(_progress, [MIN_PROGRESS, MAX_PROGRESS], [0, Number(inDuration)]);

            let outDuration = getAnimationDuration(this._outAnimation, this.duration);
            const outCurrentTime = interpolate(_progress, [MIN_PROGRESS, MAX_PROGRESS], [0, Number(outDuration)]);
            if (this._inAnimation && this._outAnimation) {
                this._inAnimation.currentTime = inCurrentTime;
                this._outAnimation.currentTime = outCurrentTime;
            }
        }
        {
            let inDuration = getAnimationDuration(this._pseudoElementInAnimation, this.duration);
            const inCurrentTime = interpolate(_progress, [MIN_PROGRESS, MAX_PROGRESS], [0, Number(inDuration)]);

            let outDuration = getAnimationDuration(this._pseudoElementOutAnimation, this.duration);
            const outCurrentTime = interpolate(_progress, [MIN_PROGRESS, MAX_PROGRESS], [0, Number(outDuration)]);
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

    set ghostLayer(_ghostLayer: GhostLayer) {
        this._ghostLayer = _ghostLayer;
    }

    get playbackRate() {
        return this._playbackRate;
    }

    get play() {
        return this._play;
    }

    get ghostLayer() {
        return this._ghostLayer!;
    }

    get isStarted() {
        return this._isStarted;
    }

    get addEventListener() {
        return this._addEventListener;
    }

    get dispatchEvent() {
        return this._dispatchEvent;
    }

    get duration() {
        const outDuration = this._outAnimation?.effect?.getComputedTiming().duration ?? this._currentScreen?.duration;
        const inDuration = this._inAnimation?.effect?.getComputedTiming().duration ?? this._nextScreen?.duration;
        const pseudoElementOutDuration = this._pseudoElementOutAnimation?.effect?.getComputedTiming().duration ?? this._currentScreen?.pseudoElementDuration;
        const pseudoElementInDuration = this._pseudoElementInAnimation?.effect?.getComputedTiming().duration ?? this._nextScreen?.pseudoElementDuration;
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
            outDuration,
            inDuration,
            pseudoElementInDuration,
            pseudoElementOutDuration
        ];
        const maxDuration = Math.max(...durations.map(Number).filter(duration => !isNaN(duration)));
        let progress: number | null | undefined = MAX_NORM_PROGRESS;
        if (maxDuration === Number(outDuration)) {
            progress = this._outAnimation?.effect?.getComputedTiming().progress;
        } else if (maxDuration === Number(inDuration)) {
            progress = this._inAnimation?.effect?.getComputedTiming().progress;
        } else if (maxDuration === Number(pseudoElementInDuration)) {
            progress = this._pseudoElementInAnimation?.effect?.getComputedTiming().progress;
        } else if (maxDuration === Number(pseudoElementOutDuration)) {
            progress = this._pseudoElementOutAnimation?.effect?.getComputedTiming().progress;
        }
        progress = Number(progress);
        return interpolate(progress, [MIN_NORM_PROGRESS, MAX_NORM_PROGRESS], [MIN_PROGRESS, MAX_PROGRESS]);
    }

    get gestureNavigating() {
        return this._gestureNavigating;
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
        return new Promise(async (resolve, reject) => {
            try {
                await this.started;
                await Promise.all([
                    this._outAnimation?.finished,
                    this._inAnimation?.finished,
                    this._pseudoElementInAnimation?.finished,
                    this._pseudoElementOutAnimation?.finished
                ]);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    get started() {
        if (this._isStarted) return Promise.resolve();
        return new Promise<void>((resolve) => {
            this.addEventListener?.('page-animation-start', () => resolve(), {once: true});
        });
    }
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());