import { createContext } from 'react';
import { interpolate } from './common/utils';
import { MAX_NORM_PROGRESS, MAX_PROGRESS, MIN_NORM_PROGRESS, MIN_PROGRESS } from './common/constants';

export class AnimationLayerData extends EventTarget {
    private _paused: boolean = false;
    private _isPlaying: boolean = false;
    public isStarted = false;
    private _progressUpdateID: number = 0;
    public pseudoElementInAnimation: Animation | null = null;
    public pseudoElementOutAnimation: Animation | null = null;
    public inAnimation: Animation | null = null;
    public outAnimation: Animation | null = null;
    private _gestureNavigating: boolean = false;
    private _playbackRate: number = 1;
    private _direction: "normal" | "reverse" = "normal";
    private _timeline: AnimationTimeline = document.timeline;
    private _onProgress: ((progress: number) => void) | null = null;

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

    set onProgress(_onProgress: ((progress: number) => void) | null) {
        this._onProgress = _onProgress;
    }

    set direction(_direction: "normal" | "reverse") {
        this._direction = _direction;
    }

    set timeline(_timeline: AnimationTimeline) {
        this._timeline = _timeline;
    }

    set playbackRate(_playbackRate: number) {
        this._playbackRate = _playbackRate;
    }

    set gestureNavigating(_gestureNavigating: boolean) {
        this._gestureNavigating = _gestureNavigating;
    }

    set progress(_progress: number) {
        if (this._onProgress) {
            this._onProgress(_progress);
        }
        
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

    get duration() {
        const outDuration = this.outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this.inAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementOutDuration = this.pseudoElementOutAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementInDuration = this.pseudoElementInAnimation?.effect?.getComputedTiming().duration;
        return Math.max(
            Number(outDuration),
            Number(inDuration),
            Number(pseudoElementOutDuration),
            Number(pseudoElementInDuration)
        ) || 0;
    }

    get progress() {
        const outDuration = this.outAnimation?.effect?.getComputedTiming().duration;
        const inDuration = this.inAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementOutDuration = this.pseudoElementOutAnimation?.effect?.getComputedTiming().duration;
        const pseudoElementInDuration = this.pseudoElementInAnimation?.effect?.getComputedTiming().duration;
        const durations = [
            outDuration,
            inDuration,
            pseudoElementInDuration,
            pseudoElementOutDuration
        ];
        const minDuration = Math.min(...durations.map(Number).filter(duration => !isNaN(duration)));
        let progress: number | null | undefined = MAX_NORM_PROGRESS;
        if (minDuration === Number(outDuration)) {
            progress = this.outAnimation?.effect?.getComputedTiming().progress;
        } else if (minDuration === Number(inDuration)) {
            progress = this.inAnimation?.effect?.getComputedTiming().progress;
        } else if (minDuration === Number(pseudoElementInDuration)) {
            progress = this.pseudoElementInAnimation?.effect?.getComputedTiming().progress;
        } else if (minDuration === Number(pseudoElementOutDuration)) {
            progress = this.pseudoElementOutAnimation?.effect?.getComputedTiming().progress;
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

    

    

    
}

export const AnimationLayerDataContext = createContext<AnimationLayerData>(new AnimationLayerData());