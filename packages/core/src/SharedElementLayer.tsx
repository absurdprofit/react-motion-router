import { clamp, interpolate } from './common/utils';
import { AnimationDirection, EasingFunction, PlainObject, ScreenChild, SharedElementNode } from './common/types';
import { MotionProgressEvent } from './common/events';
import { Component, RefObject, createRef } from 'react';
import { MAX_PROGRESS, MAX_Z_INDEX, MIN_PROGRESS } from './common/constants';
import { NavigationBase } from './NavigationBase';
import { ScreenBase } from './ScreenBase';

interface SharedElementLayerProps {
    navigation: NavigationBase;
}

interface SharedElementLayerState {}

interface TransitionState {
    delay: number;
    duration: string | CSSNumberish | undefined;
    easing: EasingFunction;
    position: number;
    node: HTMLElement;
}

export class SharedElementLayer extends Component<SharedElementLayerProps, SharedElementLayerState> {
    private readonly ref = createRef<HTMLDialogElement>();
    private animation: Animation | null = null;
    private _timeline: AnimationTimeline = document.timeline;
    private _playbackRate: number = 1;
    private _outgoingScreen: RefObject<ScreenBase> | null = null;
    private _incomingScreen: RefObject<ScreenBase> | null = null;
    
    state: SharedElementLayerState = {
        transitioning: false
    }

    set timeline(timeline: AnimationTimeline) {
        this._timeline = timeline;
        if (this.animation) this.animation.timeline = timeline;
    }

    set playbackRate(playbackRate: number) {
        this._playbackRate = playbackRate;
        if (this.animation) this.animation.playbackRate = playbackRate;
    }

    set outgoingScreen(outgoingScreen: RefObject<ScreenBase> | null) {
        this._outgoingScreen = outgoingScreen;
    }

    set incomingScreen(incomingScreen: RefObject<ScreenBase> | null) {
        this._incomingScreen = incomingScreen;
    }

    get outgoingScreen() {
        return this._outgoingScreen;
    }

    get incomingScreen() {
        return this._incomingScreen;
    }

    get timeline() {
        return this._timeline;
    }

    get playbackRate() {
        return this._playbackRate;
    }

    get ready() {
        return this.animation?.ready.then(() => {return;}) ?? Promise.resolve();
    }

    get started() {
        return new Promise<void>((resolve) => {
            this.props.navigation.addEventListener('transition-start', () => {
                resolve()
            }, { once: true });
        });
    }

    get paused() {
        return this.animation?.playState === "paused";
    }

    get running() {
        return this.animation?.playState === "running";
    }

    get finished() {
        return this.started
            .then(() => this.animation?.finished)
            .then(() => {return;});
    }

    transition() {
        const currentScene = this.outgoingScreen?.current?.sharedElementScene;
        const nextScene = this.incomingScreen?.current?.sharedElementScene;
        if (!currentScene || !nextScene) return;
    }

    render() {
        return (
            <dialog className="shared-element-layer" ref={this.ref} style={{
                position: 'absolute',
                maxWidth: 'unset',
                maxHeight: 'unset',
                width: '100vw',
                height: '100vh',
                contain: 'strict',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent'
            }}>
                <style dangerouslySetInnerHTML={{__html: ".shared-element-layer::backdrop {display: none}"}}></style>
            </dialog>
        );
    }
}