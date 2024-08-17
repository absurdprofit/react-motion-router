import { RouterBase, includesRoute, isValidScreenChild, matchRoute } from '@react-motion-router/core';
import type { LoadEvent, NestedRouterContext, PlainObject, RouterBaseConfig, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen, ScreenConfig } from './Screen';
import { HistoryEntryState, isHorizontalDirection, isOutOfBounds, isRefObject, isSupportedDirection, RouterEventMap, SwipeDirection } from './common/types';
import { Children, createRef, cloneElement, startTransition } from 'react';
import { SwipeStartEvent, SwipeEndEvent } from 'web-gesture-events';
import { GestureTimeline } from 'web-animations-extension';
import { deepEquals, isGesture, searchParamsToObject } from './common/utils';
import { GestureCancelEvent, GestureEndEvent, GestureStartEvent } from './common/events';
import { DEFAULT_GESTURE_CONFIG } from './common/constants';
import { PromiseWrapper } from './common/promise-wrapper';

export interface RouterConfig extends RouterBaseConfig {
    screenConfig?: ScreenConfig;
    disableBrowserRouting?: boolean;
    initialPath?: string;
    shouldIntercept?(navigateEvent: NavigateEvent): boolean;
    onIntercept?(navigateEvent: NavigateEvent): boolean;
}

export interface RouterProps extends RouterBaseProps<Screen> {
    config?: RouterConfig;
}

export interface RouterState extends RouterBaseState {
    transition: NavigationTransition | LoadEvent["transition"] | null;
    screenStack: ScreenChild<Screen>[];
    gestureDirection: SwipeDirection;
    gestureAreaWidth: number;
    gestureMinFlingVelocity: number;
    gestureHysteresis: number;
    gestureDisabled: boolean;
    fromKey: React.Key | null
    destinationKey: React.Key | null;
    documentTitle?: string;
    controller: AbortController | null;
}

export class Router extends RouterBase<RouterProps, RouterState, RouterEventMap> {
    public readonly navigation = new Navigation(this);
    #committed: PromiseWrapper<NavigationHistoryEntry> | null = null;

    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);
        this.state = {
            screenStack: [],
            gestureDirection: "horizontal",
            gestureAreaWidth: 50,
            gestureHysteresis: 0.5,
            gestureDisabled: true,
            gestureMinFlingVelocity: 500,
            transition: null,
            documentTitle: document.title,
            fromKey: null,
            destinationKey: null,
            controller: null
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
            gestureDisabled: config?.gestureDisabled ?? DEFAULT_GESTURE_CONFIG.gestureDisabled,
            documentTitle: config?.title
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.ref.current?.addEventListener('swipestart', this.onSwipeStart);
        this.ref.current?.addEventListener('swipeend', this.onSwipeEnd);
        window.navigation.addEventListener("currententrychange", this.onCurrentEntryChange);
        window.navigation.addEventListener("navigate", this.onNavigate);
        window.navigation.addEventListener("navigatesuccess", this.onNavigateSuccess);
        window.navigation.addEventListener("navigateerror", this.onNavigateError);
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
        window.navigation.removeEventListener("currententrychange", this.onCurrentEntryChange);
        window.navigation.removeEventListener("navigate", this.onNavigate);
        window.navigation.removeEventListener("navigatesuccess", this.onNavigateSuccess);
        window.navigation.removeEventListener("navigateerror", this.onNavigateError);
    }

    private onNavigate = () => {
        this.#committed = new PromiseWrapper();
    }

    private onCurrentEntryChange = () => {
        this.#committed?.nativeResolve?.(window.navigation.currentEntry!);
    }

    private onNavigateSuccess = () => {
        this.#committed = null;
    }

    private onNavigateError = () => {
        if (this.#committed?.state === "pending")
            this.#committed.nativeReject?.(void 0); // TODO: find out what the spec does for cancelled navigations
        this.#committed = null;
    }

    private canGestureNavigate(e: SwipeStartEvent) {
        if (!this.ref.current) return false;
        if (this.state.gestureDisabled) return false;
        const clientRect = this.ref.current.getBoundingClientRect();
        const { direction } = e;
        if ((direction === "down" || direction === "right") && !this.navigation.canGoBack) return false;
        if ((direction === "up" || direction === "left") && !this.navigation.canGoForward) return false;
        if (isOutOfBounds(direction, e, clientRect, this.state.gestureAreaWidth)) return false;

        return isSupportedDirection(direction, this.state.gestureDirection);
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
        const gesture = true;
        if (direction === "down" || direction === "right")
            window.navigation.traverseTo(this.navigation.previous!.key, { info: { gesture } });
        else
            window.navigation.traverseTo(this.navigation.next!.key, { info: { gesture } });

        this.dispatchEvent(new GestureStartEvent(e));
    }

    private onSwipeEnd = (e: SwipeEndEvent) => {
        if (!this.screenTransitionLayer.current) return;
        const progress = this.screenTransitionLayer.current.animation.effect?.getComputedTiming().progress ?? 0;
        const playbackRate = this.screenTransitionLayer.current.animation.playbackRate;
        this.screenTransitionLayer.current.animation.timeline = document.timeline;
        const hysteresisReached = playbackRate > 0 ? progress > this.state.gestureHysteresis : progress < this.state.gestureHysteresis;
        if (e.velocity < this.state.gestureMinFlingVelocity && !hysteresisReached) {
            this.screenTransitionLayer.current.animation.reverse();
            this.dispatchEvent(new GestureCancelEvent());
        } else {
            this.dispatchEvent(new GestureEndEvent(e));
        }
        if (!hysteresisReached) {
            this.screenTransitionLayer.current.animation.finished.then(() => {
                this.state.controller?.abort("gesture-cancel");
            });
        }
    }

    public get committed() {
        return this.#committed?.promise ?? null;
    }

    private get backNavigating() {
        const fromIndex = this.state.screenStack.findIndex(screen => screen.key === this.state.fromKey);
        const destinationIndex = this.state.screenStack.findIndex(screen => screen.key === this.state.destinationKey);

        return destinationIndex >= 0 && destinationIndex < fromIndex;
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

    private screenChildFromPathname(pathname: string, key: React.Key | null, config: ScreenProps["config"], params: PlainObject) {
        const screenChild = Children.toArray(this.props.children)
            .find(child => {
                if (!isValidScreenChild(child)) return;
                return matchRoute(
                    child.props.path,
                    pathname,
                    this.baseURLPattern.pathname,
                    child.props.caseSensitive
                );
            });

        if (!isValidScreenChild<Screen>(screenChild)) return null;

        return cloneElement(screenChild, {
            config: {
                title: document.title,
                ...this.props.config?.screenConfig,
                ...screenChild.props.config,
                ...config
            },
            defaultParams: {
                ...screenChild.props.defaultParams,
                ...params
            },
            resolvedPathname: pathname,
            key,
            ref: createRef<Screen>()
        });
    }

    private getScreenChildByPathname(pathname: string) {
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
        if (this.props.config?.shouldIntercept)
            return this.props.config.shouldIntercept(e);
        return e.canIntercept
            && !e.formData
            && !e.hashChange
            && !e.downloadRequest;
    }

    protected intercept(e: NavigateEvent | LoadEvent): void {
        if (this.props.config?.onIntercept && e.navigationType !== "load")
            if (this.props.config.onIntercept(e) || e.defaultPrevented)
                return;

        switch (e.navigationType) {
            case "load":
                this.handleLoad(e);
                break;

            case "reload":
            case "replace":
                this.handleReplace(e);
                break;

            default:
                this.handleDefault(e);
                break;
        }
    }

    private handleLoad(e: LoadEvent) {
        const handler = () => {
            const fromKey = e.transition?.from?.key ?? null;
            const destinationKey = e.destination.key;
            const transition = e.transition;
            const screenStack = new Array<ScreenChild<Screen>>();
            const entries = this.navigation.entries;
            entries.forEach((entry) => {
                if (!entry.url) return null;
                const { params, config } = entry.getState<HistoryEntryState>() ?? {};
                const searchPart = entry.url.search;
                const searchParams = new URLSearchParams(searchPart);
                const queryParams = searchParamsToObject(searchParams);
                const screen = this.screenChildFromPathname(entry.url.pathname, entry.key, config, { ...queryParams, ...params });
                if (!screen) return null;
                screenStack.push(screen);
            });

            return new Promise<void>((resolve, reject) => startTransition(() => {
                this.setState({ screenStack, fromKey, transition, destinationKey }, async () => {
                    const { initialPath } = this.props.config ?? {};
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
                    await this.dispatchLifecycleHandlers(currentScreen, null, signal).catch(reject);
                    this.setState({ destinationKey: null, fromKey: null, transition: null }, resolve);
                });
            }));
        }

        e.intercept({ handler });
    }

    private handleReplace(e: NavigateEvent) {
        const screenStack = this.state.screenStack;
        const destination = e.destination;
        const destinationPathname = new URL(destination.url).pathname;
        const { params, config } = destination.getState() as HistoryEntryState ?? {};
        const queryParams = searchParamsToObject(new URL(destination.url).searchParams);
        const destinationKey = window.navigation.currentEntry?.key ?? destination.key;
        const destinationScreen = this.screenChildFromPathname(destinationPathname, destinationKey, config, { ...queryParams, ...params });
        if (!destinationScreen) return e.preventDefault();
        const handler = () => {
            const isHotReplace = this.state.transition !== null;
            const transition = this.state.transition ?? window.navigation.transition;
            const fromKey = transition?.from?.key ?? null;
            const currentIndex = screenStack.findIndex(screen => screen.key === this.navigation.current?.key);
            screenStack.splice(
                currentIndex,
                1,
                destinationScreen
            );

            return new Promise<void>((resolve, reject) => startTransition(() => {
                this.setState({ destinationKey, fromKey, transition, screenStack }, async () => {
                    const signal = e.signal;
                    const outgoingScreen = this.getScreenRefByKey(String(fromKey));
                    const incomingScreen = this.getScreenRefByKey(String(destinationKey));
                    const pendingLifecycleHandlers = this.dispatchLifecycleHandlers(incomingScreen, null, signal).catch(reject);
                    if (isHotReplace) {
                        const currentTime = this.screenTransitionLayer.current?.animation.currentTime ?? 0;
                        this.screenTransitionLayer.current?.animation.cancel();
                        await new Promise(requestAnimationFrame);
                        const animation = this.screenTransition(incomingScreen, outgoingScreen);
                        if (animation) {
                            animation.currentTime = currentTime;
                        }
                        animation?.updatePlaybackRate(1);
                        await animation?.finished.catch(reject);
                    }
                    await pendingLifecycleHandlers;
                    this.setState({ destinationKey: null, fromKey: null, transition: null }, resolve);
                });
            }));
        };

        e.intercept({ handler });
    }

    private handleDefault(e: NavigateEvent) {
        const screenStack = this.state.screenStack;
        const destination = e.destination;
        const destinationPathname = new URL(destination.url).pathname;
        if (!isValidScreenChild<Screen>(this.getScreenChildByPathname(destinationPathname)))
            return e.preventDefault();
        const handler = () => {
            const transition = window.navigation.transition;
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
            const fromKey = (screenStack[fromIndex]?.key || transition?.from.key) ?? null;
            const destinationIndex = screenStack.findIndex(screen => screen.key === e.destination.key);
            const destinationKey = (screenStack[destinationIndex]?.key || window.navigation.currentEntry?.key) ?? null;
            if (e.navigationType === "push") {
                const { params, config } = destination.getState() as HistoryEntryState ?? {};
                const destinationPathname = new URL(destination.url).pathname;
                const queryParams = searchParamsToObject(new URL(destination.url).searchParams);
                const destinationScreen = this.screenChildFromPathname(destinationPathname, destinationKey, config, { ...queryParams, ...params });
                if (!destinationScreen) return Promise.resolve();
                screenStack.splice(
                    fromIndex + 1,
                    Infinity, // Remove all screens after current
                    destinationScreen
                );
            }

            const controller = new AbortController();
            return new Promise<void>((resolve, reject) => startTransition(() => {
                this.setState({ controller, destinationKey, fromKey, transition, screenStack }, async () => {
                    controller.signal.onabort = reject;
                    const signal = e.signal;
                    const outgoingScreen = this.getScreenRefByKey(String(fromKey));
                    const incomingScreen = this.getScreenRefByKey(String(destinationKey));
                    const pendingLifecycleHandlers = this.dispatchLifecycleHandlers(incomingScreen, outgoingScreen, signal).catch(reject);
                    const animation = this.screenTransition(incomingScreen, outgoingScreen);
                    animation?.updatePlaybackRate(1);
                    animation?.finished.catch(reject);
                    await pendingLifecycleHandlers;
                    this.setState({ destinationKey: null, fromKey: null, transition: null, controller: null }, resolve);
                });
            }));
        }

        let commit;
        if (isGesture(e.info)) {
            commit = "after-transition";
            this.addEventListener("gesture-end", () => e.commit(), { once: true });
        } else {
            commit = "immediate";
        }
        const options = { handler, commit };
        e.intercept(options);
    }

    private async dispatchLifecycleHandlers(incomingScreen: React.RefObject<Screen> | null, outgoingScreen: React.RefObject<Screen> | null, signal: AbortSignal) {
        let animationStarted = false;
        this.addEventListener('transition-start', () => animationStarted = true, { once: true });

        await Promise.all([
            outgoingScreen?.current?.onExit(signal),
            incomingScreen?.current?.onEnter(signal),
            incomingScreen?.current?.load(signal)
        ]);

        if (animationStarted)
            await new Promise((resolve) => this.addEventListener('transition-end', resolve, { once: true }));

        await Promise.all([
            outgoingScreen?.current?.onExited(signal).then(() => outgoingScreen.current?.blur({ signal })),
            incomingScreen?.current?.onEntered(signal).then(() => incomingScreen.current?.focus({ signal }))
        ]);
    }

    private screenTransition(
        incomingScreen: React.RefObject<Screen> | null,
        outgoingScreen: React.RefObject<Screen> | null
    ) {
        const { backNavigating } = this;
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