import { createContext } from 'react';
import { AnimationProvider } from './AnimationProvider';
import { getAnimationDuration, interpolate } from './common/utils';
import { MAX_NORM_PROGRESS, MAX_PROGRESS, MIN_NORM_PROGRESS, MIN_PROGRESS } from './common/constants';
import { GhostLayer } from './GhostLayer';

export class AnimationLayerData extends EventTarget {
    private _paused: boolean = false;
    private _isPlaying: boolean = false;
    private _isStarted = false;
    private _currentScreen: AnimationProvider | null = null;
    private _nextScreen: AnimationProvider | null = null;
    private _progressUpdateID: number = 0;
    private _pseudoElementInAnimation: Animation | null = null;
    private _pseudoElementOutAnimation: Animation | null = null;
    private _inAnimation: Animation | null = null;
    private _outAnimation: Animation | null = null;
    private _gestureNavigating: boolean = false;
    private _playbackRate: number = 1;
    private _direction: "normal" | "reverse" = "normal";
    private _timeline: AnimationTimeline = document.timeline;
    private _ghostLayer: GhostLayer | null = null;
    private _onProgress: ((progress: number) => void) | null = null;
    private _shouldAnimate: boolean = true;
    private _onAnimationStart: (() => void) | null = null;
    private _onAnimationEnd: (() => void) | null = null;
    private _onAnimationCancel: (() => void) | null = null;

    private updateProgress() {
        if (this._gestureNavigating && this._paused) {
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
        this._playbackRate = 1;
        this._paused = false;
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

        this._onAnimationCancel?.();
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

            await this._nextScreen.mounted(true);
        }
    }

    async pageTransition() {
        if (this._inAnimation || this._outAnimation) {
            // cancel playing animation
            this.cancel();
            this.reset();
        }
        if (this._currentScreen && this._nextScreen && this._shouldAnimate) {
            this._outAnimation = this._currentScreen.outAnimation;
            this._pseudoElementOutAnimation = this._currentScreen.pseudoElementOutAnimation;
            this._inAnimation = this._nextScreen.inAnimation;
            this._pseudoElementInAnimation = this._nextScreen.pseudoElementInAnimation;
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
                if (this._paused) {
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
                this._onAnimationStart?.();
                this.dispatchEvent?.(new CustomEvent('animation-start'));

                this.updateProgress();

                await this.finished.finally(this.finishProgress.bind(this));

                this.removeAnimations();

                this._isPlaying = false;
                this._onAnimationEnd?.();

                // if playback rate is 2 then gesture navigation was aborted
                if (!this._gestureNavigating || this._playbackRate === 0.5) {
                    this._currentScreen.mounted(false); // awaiting causes flicker bug on iOS
                } else {
                    await this._nextScreen.mounted(false);
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

    set shouldAnimate(_shouldAnimate: boolean) {
        this._shouldAnimate = _shouldAnimate;
    }

    set direction(_direction: "normal" | "reverse") {
        this._direction = _direction;
        if (this._inAnimation)
            this._inAnimation.effect?.updateTiming({ direction: this._direction });
        if (this._outAnimation)
            this._outAnimation.effect?.updateTiming({ direction: this._direction });
        if (this._pseudoElementInAnimation)
            this._pseudoElementInAnimation.effect?.updateTiming({ direction: this._direction });
        if (this._pseudoElementOutAnimation)
            this._pseudoElementOutAnimation.effect?.updateTiming({ direction: this._direction });
    }

    set timeline(_timeline: AnimationTimeline) {
        this._timeline = _timeline;
        if (this._inAnimation)
            this._inAnimation.timeline = this._timeline;
        if (this._outAnimation)
            this._outAnimation.timeline = this._timeline;
        if (this._pseudoElementInAnimation)
            this._pseudoElementInAnimation.timeline = this._timeline;
        if (this._pseudoElementOutAnimation)
            this._pseudoElementOutAnimation.timeline = this._timeline;
    }

    set playbackRate(_playbackRate: number) {
        this._playbackRate = _playbackRate;
        if (this._inAnimation)
            this._inAnimation.playbackRate = this._playbackRate;
        if (this._outAnimation)
            this._outAnimation.playbackRate = this._playbackRate;
        if (this._pseudoElementInAnimation)
            this._pseudoElementInAnimation.playbackRate = this._playbackRate;
        if (this._pseudoElementOutAnimation)
            this._pseudoElementOutAnimation.playbackRate = this._playbackRate;
    }

    set gestureNavigating(_gestureNavigating: boolean) {
        this._gestureNavigating = _gestureNavigating;
    }

    pause() {
        this._paused = true;
        this._inAnimation?.pause();
        this._outAnimation?.pause();
        this._pseudoElementInAnimation?.pause();
        this._pseudoElementOutAnimation?.pause();
    }

    play() {
        this._paused = false;
        this._inAnimation?.play();
        this._outAnimation?.play();
        this._pseudoElementInAnimation?.play();
        this._pseudoElementOutAnimation?.play();
        if (this._gestureNavigating) this.updateProgress();
    }

    get paused() {
        return this._paused;
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

    set onAnimationStart(_onAnimationStart: (() => void) | null) {
        this._onAnimationStart = _onAnimationStart;
    }

    set onAnimationEnd(_onAnimationEnd: (() => void) | null) {
        this._onAnimationEnd = _onAnimationEnd;
    }

    set onAnimationCancel(_onAnimationCancel: (() => void) | null) {
        this._onAnimationCancel = _onAnimationCancel;
    }

    set ghostLayer(_ghostLayer: GhostLayer) {
        this._ghostLayer = _ghostLayer;
    }

    get playbackRate() {
        return this._playbackRate;
    }

    get direction() {
        return this._direction;
    }

    get timeline() {
        return this._timeline;
    }

    get ghostLayer() {
        return this._ghostLayer!;
    }

    get isStarted() {
        return this._isStarted;
    }

    get duration() {
        const outDuration = this._outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this._inAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementOutDuration = this._pseudoElementOutAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementInDuration = this._pseudoElementInAnimation?.effect?.getComputedTiming().duration;
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
        const minDuration = Math.min(...durations.map(Number).filter(duration => !isNaN(duration)));
        let progress: number | null | undefined = MAX_NORM_PROGRESS;
        if (minDuration === Number(outDuration)) {
            progress = this._outAnimation?.effect?.getComputedTiming().progress;
        } else if (minDuration === Number(inDuration)) {
            progress = this._inAnimation?.effect?.getComputedTiming().progress;
        } else if (minDuration === Number(pseudoElementInDuration)) {
            progress = this._pseudoElementInAnimation?.effect?.getComputedTiming().progress;
        } else if (minDuration === Number(pseudoElementOutDuration)) {
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
            this.addEventListener?.('animation-start', () => resolve(), { once: true });
        });
    }
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());