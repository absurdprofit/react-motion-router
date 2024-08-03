import { RouterBase, includesRoute, isValidScreenChild, matchRoute } from '@react-motion-router/core';
import type { LoadEvent, NestedRouterContext, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen } from './Screen';
import { HistoryEntryState, isHorizontalDirection, isRefObject, SwipeDirection } from './common/types';
import { Children, createRef, cloneElement, startTransition } from 'react';
import { SwipeStartEvent, SwipeEndEvent } from 'web-gesture-events';
import { cssNumberishToNumber, GestureTimeline } from 'web-animations-extension';
import { deepEquals, isRollback, searchParamsToObject } from './common/utils';
import { GestureCancelEvent, GestureEndEvent, GestureStartEvent } from './common/events';
import { DEFAULT_GESTURE_CONFIG } from './common/constants';

export interface RouterProps extends RouterBaseProps<Screen> {
    config: RouterBaseProps["config"] & {
        screenConfig?: ScreenProps["config"];
        disableBrowserRouting?: boolean;
        initialPath?: string;
        shouldIntercept?(navigateEvent: NavigateEvent): boolean;
        onIntercept?(navigateEvent: NavigateEvent): boolean;
    }
}

export interface RouterState extends RouterBaseState {
    backNavigating: boolean;
    transition: NavigationTransition | LoadEvent["transition"] | null;
    screenStack: ScreenChild<ScreenProps, Screen>[];
    gestureDirection: SwipeDirection;
    gestureAreaWidth: number;
    gestureMinFlingVelocity: number;
    gestureHysteresis: number;
    disableGesture: boolean;
    fromKey: React.Key | null
    destinationKey: React.Key | null;
    documentTitle?: string;
}

export class Router extends RouterBase<RouterProps, RouterState> {
    public readonly navigation = new Navigation(this);

    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);
        this.state = {
            screenStack: [],
            gestureDirection: "horizontal",
            gestureAreaWidth: 50,
            gestureHysteresis: 0.5,
            disableGesture: true,
            gestureMinFlingVelocity: 500,
            transition: null,
            backNavigating: false,
            documentTitle: document.title,
            fromKey: null,
            destinationKey: null
        };
    }

    static readonly defaultProps: Partial<RouterProps> = {
        config: {
            screenConfig: {
                ...DEFAULT_GESTURE_CONFIG
            }
        }
    };

    static getDerivedStateFromProps(_: RouterProps, state: RouterState) {
        const config = state.screenStack.find(screen => isRefObject(screen.ref) && screen.ref.current?.focused)?.props.config;
        document.title = config?.title ?? document.title;
        return {
            gestureDirection: config?.gestureDirection ?? DEFAULT_GESTURE_CONFIG.gestureDirection,
            gestureAreaWidth: config?.gestureAreaWidth ?? DEFAULT_GESTURE_CONFIG.gestureAreaWidth,
            gestureMinFlingVelocity: config?.gestureMinFlingVelocity ?? DEFAULT_GESTURE_CONFIG.gestureMinFlingVelocity,
            gestureHysteresis: config?.gestureHysteresis ?? DEFAULT_GESTURE_CONFIG.gestureHysteresis,
            disableGesture: config?.disableGesture ?? DEFAULT_GESTURE_CONFIG.disableGesture,
            documentTitle: config?.title
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.ref.current?.addEventListener('swipestart', this.onSwipeStart);
        this.ref.current?.addEventListener('swipeend', this.onSwipeEnd);
    }

    shouldComponentUpdate(nextProps: Readonly<RouterProps>, nextState: Readonly<RouterState>): boolean {
        return (
            !deepEquals(this.props.config, nextProps.config)
            || !deepEquals(this.state, nextState)
            || this.props.id !== nextProps.id
        );
    }

    componentWillUnmount(): void {
        this.ref.current?.removeEventListener('swipestart', this.onSwipeStart);
        this.ref.current?.removeEventListener('swipeend', this.onSwipeEnd);
    }

    private canGestureNavigate(e: SwipeStartEvent) {
        if (!this.ref.current) return false;
        if (this.state.disableGesture) return false;
        const clientRect = this.ref.current.getBoundingClientRect();
        const { direction } = e;
        if ((direction === "down" || direction === "right") && !this.navigation.canGoBack) return false;
        if ((direction === "up" || direction === "left") && !this.navigation.canGoForward) return false;
        if (isHorizontalDirection(direction) !== isHorizontalDirection(this.state.gestureDirection)) return false;
        if (direction === "right" && Math.abs(e.x - clientRect.left) >= this.state.gestureAreaWidth) return false;
        if (direction === "left" && Math.abs(e.x - clientRect.right) >= this.state.gestureAreaWidth) return false;
        if (direction === "down" && Math.abs(e.y - clientRect.top) >= this.state.gestureAreaWidth) return false;
        if (direction === "up" && Math.abs(e.y - clientRect.bottom) >= this.state.gestureAreaWidth) return false;
        return true;
    }

    private onSwipeStart = (e: SwipeStartEvent) => {
        if (!this.canGestureNavigate(e)) return;
        if (!this.ref.current || !this.screenTransitionLayer.current) return;
        const { direction } = e;

        let axis: "x" | "y" = isHorizontalDirection(direction) ? "x" : "y";
        let rangeStart;
        let rangeEnd;
        switch (direction) {
            case "right":
                rangeStart = 0;
                rangeEnd = this.ref.current.clientWidth;
                break;
            case "left":
                rangeStart = this.ref.current.clientWidth;
                rangeEnd = 0;
                break;
            case "down":
                rangeStart = 0;
                rangeEnd = this.ref.current.clientHeight;
                break;
            case "up":
                rangeStart = this.ref.current.clientHeight;
                rangeEnd = 0;
                break;
        }
        this.screenTransitionLayer.current.animation.timeline = new GestureTimeline({
            source: this.ref.current,
            type: "swipe",
            axis,
            rangeStart,
            rangeEnd
        });
        if (direction === "down" || direction === "right")
            this.navigation.goBack();
        else
            this.navigation.goForward();

        this.dispatchEvent(new GestureStartEvent(e));
    }

    private onSwipeEnd = (e: SwipeEndEvent) => {
        if (!this.screenTransitionLayer.current) return;
        const progress = this.screenTransitionLayer.current.animation.effect?.getComputedTiming().progress ?? 0;
        const playbackRate = this.screenTransitionLayer.current.animation.playbackRate;
        this.screenTransitionLayer.current.animation.timeline = document.timeline;
        const hysteresisReached = playbackRate > 0 ? progress > this.state.gestureHysteresis : progress < this.state.gestureHysteresis;
        let rollback = false;
        if (e.velocity < this.state.gestureMinFlingVelocity && !hysteresisReached) {
            this.screenTransitionLayer.current.animation.reverse();
            rollback = true;
            this.dispatchEvent(new GestureCancelEvent());
        } else {
            this.dispatchEvent(new GestureEndEvent(e));
        }
        const { fromKey } = this.state;
        if (rollback && fromKey) {
            this.state.transition?.finished.then(() => {
                window.navigation.traverseTo(fromKey.toString(), { info: { rollback } });
            });
        }
    }

    protected get screens() {
        const screenStack = this.state.screenStack;
        return screenStack
            .filter((screen, index) => {
                const currentScreenRef = screen.ref ?? null;
                const nextScreenRef = screenStack.at(index + 1)?.ref;
                return (isRefObject(currentScreenRef) && currentScreenRef.current?.config.keepAlive)
                    || (isRefObject(nextScreenRef) && nextScreenRef.current?.config.presentation === "modal")
                    || (isRefObject(nextScreenRef) && nextScreenRef.current?.config.presentation === "dialog")
                    || screen.key === this.navigation.current?.key
                    || screen.key === this.state.fromKey
                    || screen.key === this.state.destinationKey;
            });
    }

    private screenChildFromPathname(pathname: string) {
        return Children.toArray(this.props.children)
            .find(child => {
                if (!isValidScreenChild(child)) return;
                return matchRoute(
                    child.props.path,
                    pathname,
                    this.baseURLPattern.pathname,
                    child.props.caseSensitive
                );
            });
    }

    private getScreenRefByKey(key: string) {
        const screen = this.state.screenStack.find(screen => screen.key === key)?.ref;
        if (isRefObject(screen)) return screen;
        return null;
    }

    protected canIntercept(e: NavigateEvent): boolean {
        const pathname = new URL(e.destination.url).pathname;
        const baseURLPattern = this.baseURLPattern.pathname;
        return this.mounted
            && this.shouldIntercept(e)
            && includesRoute(this.pathPatterns, pathname, baseURLPattern);
    }

    protected shouldIntercept(e: NavigateEvent): boolean {
        if (this.props.config.shouldIntercept)
            return this.props.config.shouldIntercept(e);
        return e.canIntercept
            && !e.formData
            && !e.hashChange
            && !e.downloadRequest;
    }

    protected intercept(e: NavigateEvent | LoadEvent): void {
        if (this.props.config.onIntercept && e.navigationType !== "load")
            if (this.props.config.onIntercept(e) || e.defaultPrevented)
                return;

        switch (e.navigationType) {
            case "reload":
            case "replace":
                this.handleReplace(e);
                break;

            case "load":
                this.handleLoad(e);
                break;

            default:
                this.handleDefault(e);
                break;
        }
    }

    private handleReplace(e: NavigateEvent) {
        const screenStack = this.state.screenStack;
        const destinationPathname = new URL(e.destination.url).pathname;
        const destinationScreen = this.screenChildFromPathname(destinationPathname);
        if (!isValidScreenChild<Screen>(destinationScreen)) return e.preventDefault();
        const handler = () => {
            const { params, config } = e.destination.getState() as HistoryEntryState ?? {};
            const destination = e.destination;
            const transition = this.state.transition ?? window.navigation.transition;
            const fromKey = transition?.from?.key ?? null;
            const destinationKey = window.navigation.currentEntry?.key ?? destination.key;
            const resolvedPathname = new URL(e.destination.url).pathname;
            const queryParams = searchParamsToObject(new URL(destination.url).search);
            const currentIndex = screenStack.findIndex(screen => screen.key === this.navigation.current?.key);
            const backNavigating = this.state.backNavigating;
            screenStack.splice(
                currentIndex,
                1,
                cloneElement(destinationScreen, {
                    config: {
                        title: document.title,
                        ...this.props.config.screenConfig,
                        ...destinationScreen.props.config,
                        ...config
                    },
                    defaultParams: {
                        ...destinationScreen.props.defaultParams,
                        ...queryParams,
                        ...params,
                    },
                    resolvedPathname,
                    key: destinationKey,
                    ref: createRef<Screen>()
                })
            );

            // let { progress } = this.screenTransitionLayer.current?.animation.effect?.getComputedTiming() ?? {};
            // progress ??= 0;
            const progress = 0.1;   
            return new Promise<void>((resolve, reject) => startTransition(() => {
                this.setState({ destinationKey, fromKey, transition, screenStack }, async () => {
                    const signal = e.signal;
                    const outgoingScreen = this.getScreenRefByKey(String(fromKey));
                    const incomingScreen = this.getScreenRefByKey(String(destinationKey));
                    const pendingLifecycleHandlers = this.dispatchLifecycleHandlers(incomingScreen?.current ?? null, null, signal).catch(reject);
                    if (!isRollback(e.info)) {
                        const animation = this.screenTransition(incomingScreen, outgoingScreen, backNavigating);
                        if (animation?.effect) {
                            const { endTime = 0 } = animation.effect.getComputedTiming();
                            animation.currentTime = cssNumberishToNumber(endTime) * progress;
                        }
                        animation?.updatePlaybackRate(1);
                        signal.addEventListener('abort', () => animation?.finish());
                        await animation?.finished.catch(reject);
                    }
                    await pendingLifecycleHandlers;
                    this.setState({ destinationKey: null, fromKey: null }, resolve);
                });
            }));
        };

        e.intercept({ handler });
    }

    private handleLoad(e: LoadEvent) {
        const handler = () => {
            const fromKey = e.transition?.from?.key ?? null;
            const destinationKey = e.destination.key;
            const transition = e.transition;
            const screenStack = new Array<ScreenChild<ScreenProps, Screen>>();
            const entries = this.navigation.entries;
            entries.forEach((entry) => {
                if (!entry.url) return null;
                const screen = this.screenChildFromPathname(entry.url.pathname);
                if (!isValidScreenChild<Screen>(screen)) return null;
                const { params, config } = entry.getState<HistoryEntryState>() ?? {};
                const queryParams = searchParamsToObject(entry.url.search);
                screenStack.push(
                    cloneElement(screen, {
                        config: {
                            title: document.title,
                            ...this.props.config.screenConfig,
                            ...screen.props.config,
                            ...config
                        },
                        defaultParams: {
                            ...screen.props.defaultParams,
                            ...queryParams,
                            ...params
                        },
                        resolvedPathname: entry.url.pathname,
                        key: entry.key,
                        ref: createRef<Screen>()
                    })
                );
            });

            return new Promise<void>((resolve, reject) => startTransition(() => {
                this.setState({ screenStack, fromKey, transition, destinationKey }, async () => {
                    const { initialPath } = this.props.config;
                    const [firstEntry] = entries;
                    if (
                        initialPath
                        && entries.length === 1
                        && firstEntry.url
                        && !matchRoute(
                            initialPath,
                            firstEntry.url.pathname,
                            this.baseURLPattern.pathname
                        )
                    ) {
                        const transitionFinished = window.navigation.transition?.finished ?? Promise.resolve();
                        transitionFinished.then(() => {
                            this.navigation.replace(initialPath).finished.then(() => {
                                const state = e.destination.getState() as HistoryEntryState ?? {};
                                this.navigation.push(e.destination.url, state);
                            });
                        });
                        return resolve();
                    }
                    const signal = e.signal;
                    if (this.navigation.current?.key === undefined)
                        reject(new Error("Current key is undefined"));

                    const currentScreen = this.getScreenRefByKey(this.navigation.current.key);
                    await this.dispatchLifecycleHandlers(currentScreen?.current ?? null, null, signal).catch(reject);
                    this.setState({ destinationKey: null, fromKey: null }, resolve);
                });
            }));
        }

        e.intercept({ handler });
    }

    private handleDefault(e: NavigateEvent) {
        const screenStack = this.state.screenStack;
        const destinationPathname = new URL(e.destination.url).pathname;
        const destinationScreen = this.screenChildFromPathname(destinationPathname);
        if (!isValidScreenChild<Screen>(destinationScreen)) return e.preventDefault();
        const handler = () => {
            const { params, config } = e.destination.getState() as HistoryEntryState ?? {};
            const transition = window.navigation.transition;
            const destination = e.destination;
            const resolvedPathname = new URL(e.destination.url).pathname;
            let fromIndex = screenStack.findIndex(screen => screen.key === transition?.from.key);
            if (fromIndex === -1 && e.navigationType === "traverse") {
                fromIndex = screenStack.findIndex(screen => {
                    if (!transition?.from.url || !screen.props.resolvedPathname) return false;
                    const pathnameMatched = transition.from.url.includes(screen.props.resolvedPathname);
                    const patternMatched = matchRoute(
                        screen.props.path,
                        new URL(transition.from.url).pathname,
                        this.baseURLPattern.pathname,
                        screen.props.caseSensitive
                    );
                    return pathnameMatched && patternMatched;
                });
            }
            const destinationIndex = screenStack.findIndex(screen => screen.key === e.destination.key);
            const fromKey = (screenStack[fromIndex]?.key || transition?.from.key) ?? null;
            const destinationKey = (screenStack[destinationIndex]?.key || window.navigation.currentEntry?.key) ?? null;
            const backNavigating = destinationIndex >= 0 && destinationIndex < fromIndex;
            if (e.navigationType === "push") {
                const queryParams = searchParamsToObject(new URL(destination.url).search);
                screenStack.splice(
                    fromIndex + 1,
                    Infinity, // Remove all screens after current
                    cloneElement(destinationScreen, {
                        config: {
                            title: document.title,
                            ...this.props.config.screenConfig,
                            ...destinationScreen.props.config,
                            ...config
                        },
                        defaultParams: {
                            ...destinationScreen.props.defaultParams,
                            ...queryParams,
                            ...params,
                        },
                        resolvedPathname,
                        key: window.navigation.currentEntry?.key,
                        ref: createRef<Screen>()
                    })
                );
            }

            return new Promise<void>((resolve, reject) => startTransition(() => {
                this.setState({ destinationKey, fromKey, transition, screenStack, backNavigating }, async () => {
                    const signal = e.signal;
                    const outgoingScreen = this.getScreenRefByKey(String(fromKey));
                    const incomingScreen = this.getScreenRefByKey(String(destinationKey));
                    const pendingLifecycleHandlers = this.dispatchLifecycleHandlers(incomingScreen?.current ?? null, outgoingScreen?.current ?? null, signal).catch(reject);
                    if (!isRollback(e.info)) {
                        const animation = this.screenTransition(incomingScreen, outgoingScreen, backNavigating);
                        animation?.updatePlaybackRate(1);
                        signal.addEventListener('abort', () => animation?.cancel());
                        animation?.finished.catch(reject);
                    }
                    await pendingLifecycleHandlers;
                    this.setState({ destinationKey: null, fromKey: null }, resolve);
                });
            }));
        }

        e.intercept({ handler });
    }

    private async dispatchLifecycleHandlers(incomingScreen: Screen | null, outgoingScreen: Screen | null, signal: AbortSignal) {
        let animationStarted = false;
        this.addEventListener('transition-start', () => animationStarted = true, { once: true });

        await Promise.all([
            outgoingScreen?.onExit(signal).then(() => outgoingScreen.blur()),
            incomingScreen?.onEnter(signal).then(() => incomingScreen.focus()),
            incomingScreen?.load(signal)
        ]);

        if (animationStarted)
            await new Promise((resolve) => this.addEventListener('transition-end', resolve, { once: true }));

        await Promise.all([
            outgoingScreen?.onExited(signal),
            incomingScreen?.onEntered(signal)
        ]);
    }

    private screenTransition(
        incomingScreen: React.RefObject<Screen> | null,
        outgoingScreen: React.RefObject<Screen> | null,
        backNavigating: boolean
    ) {
        if (this.screenTransitionLayer.current && incomingScreen && outgoingScreen) {
            this.screenTransitionLayer.current.direction = backNavigating ? 'reverse' : 'normal';
            if (incomingScreen.current?.transitionProvider.current) {
                incomingScreen.current.transitionProvider.current.exiting = false;
            }
            if (outgoingScreen.current?.transitionProvider.current) {
                outgoingScreen.current.transitionProvider.current.exiting = true;
            }
            if (this.screenTransitionLayer.current.sharedElementTransitionLayer.current) {
                this.screenTransitionLayer.current.sharedElementTransitionLayer.current.outgoingScreen = outgoingScreen;
                this.screenTransitionLayer.current.sharedElementTransitionLayer.current.incomingScreen = incomingScreen;
            }
            const topScreenIndex = this.screens.findIndex(screen => screen.ref === (backNavigating ? outgoingScreen : incomingScreen));
            this.screenTransitionLayer.current.screens = this.screens
                .map((screen, index) => {
                    // normalise indices making incoming screen index 1 and preceding screens index 0...-n
                    index = (index - topScreenIndex) + 1;
                    if (isRefObject(screen.ref) && screen.ref.current?.transitionProvider.current) {
                        screen.ref.current.transitionProvider.current.index = index;
                        return screen.ref;
                    }
                    return null;
                })
                .filter(isRefObject);

            return this.screenTransitionLayer.current.transition();
        }
    }
}