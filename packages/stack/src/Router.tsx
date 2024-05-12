import { RouterBase, clamp, includesRoute, isFirstLoad, isValidScreenChild, matchRoute } from '@react-motion-router/core';
import type { NestedRouterContext, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen } from './Screen';
import { HistoryEntryState, isHorizontalDirection, isRefObject, SwipeDirection } from './common/types';
import { Children, createRef, cloneElement, startTransition } from 'react';
import { SwipeStartEvent, SwipeEndEvent } from 'web-gesture-events';
import { GestureTimeline } from 'web-animations-extension';
import { searchParamsToObject } from './common/utils';

export interface RouterProps extends RouterBaseProps<Screen> {
    config: RouterBaseProps["config"] & {
        screenConfig?: ScreenProps["config"];
        disableBrowserRouting?: boolean;
        initialPath?: string;
        shouldIntercept?(navigateEvent: NavigateEvent): boolean;
        onIntercept?(navigateEvent: NavigateEvent): boolean;
    }
}

export interface RouterState extends RouterBaseState<Navigation> {
    backNavigating: boolean;
    transition: NavigationTransition | null;
    destination: NavigationDestination | null;
    screenStack: ScreenChild<ScreenProps, Screen>[];
    gestureDirection: SwipeDirection;
    gestureAreaWidth: number;
    gestureMinFlingVelocity: number;
    gestureHysteresis: number;
    disableGesture: boolean;
}

export class Router extends RouterBase<RouterProps, RouterState> {
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);

        this.state = {
            navigation: new Navigation(this),
            screenStack: [],
            gestureDirection: "horizontal",
            gestureAreaWidth: 50,
            gestureHysteresis: 0.5,
            disableGesture: true,
            gestureMinFlingVelocity: 500,
            transition: null,
            destination: null,
            backNavigating: false,
            defaultDocumentTitle: document.title,
            documentTitle: ''
        };
    }

    static getDerivedStateFromProps(_: RouterProps, state: RouterState) {
        const config = state.screenStack.find(screen => screen.key === state.navigation.current.key)?.props.config;
        return {
            gestureDirection: config?.gestureDirection ?? state.gestureDirection,
            gestureAreaWidth: config?.gestureAreaWidth ?? state.gestureAreaWidth,
            gestureMinFlingVelocity: config?.gestureMinFlingVelocity ?? state.gestureMinFlingVelocity,
            gestureHysteresis: config?.gestureHysteresis ?? state.gestureHysteresis,
            disableGesture: config?.disableGesture ?? state.disableGesture
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.ref.current?.addEventListener('swipestart', this.onSwipeStart);
        this.ref.current?.addEventListener('swipeend', this.onSwipeEnd);
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
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
        for (let target of e.composedPath().reverse()) {
            if (
                target instanceof HTMLElement
                && target.classList.contains('gesture-region')
                && target.dataset.disabled === "false"
            ) return false;
            if (target === e.gestureTarget) break;
        }
        return true;
    }

    private onSwipeStart = (e: SwipeStartEvent) => {
        // TODO: factor in gesture region
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
    }

    private onSwipeEnd = (e: SwipeEndEvent) => {
        if (!this.screenTransitionLayer.current) return;
        this.screenTransitionLayer.current.animation.timeline = document.timeline;
        const progress = this.screenTransitionLayer.current.animation.effect?.getComputedTiming().progress ?? 0;
        const hysteresisReached = this.state.backNavigating ? progress > this.state.gestureHysteresis : progress < this.state.gestureHysteresis;
        if (e.velocity < this.state.gestureMinFlingVelocity && hysteresisReached) {
            this.screenTransitionLayer.current.animation.reverse();
        }
        this.screenTransitionLayer.current.animation.play();
    }

    protected get screens() {
        return this.state.screenStack
            .filter(screen => {
                const ref = screen.ref ?? null;
                return isRefObject(ref) && ref.current?.routeProp.config.keepAlive
                    || screen.key === this.navigation.current.key
                    || screen.key === this.state.transition?.from.key
                    || screen.key === this.state.destination?.key;
            });
    }

    private setZIndices() {
        const screens = this.screens;
        const currentIndex = screens.findIndex(screen => screen.key === this.navigation.current.key);
        return Promise.all(
            screens.map((screen, index) => {
                const zIndex = (index + 1) - currentIndex;
                const ref = screen.ref;
                if (ref && isRefObject(ref) && ref.current?.screenTransitionProvider.current) {
                    return ref.current.screenTransitionProvider.current.setZIndex(zIndex);
                }
                return Promise.resolve();
            })
        );
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
        if (screen && isRefObject(screen)) return screen;
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

    protected intercept(e: NavigateEvent): void {
        if (this.props.config.onIntercept)
            if (this.props.config.onIntercept(e) || e.defaultPrevented)
                return;

        switch (e.navigationType) {
            case "replace":
                this.handleReplace(e);
                break;

            case "reload":
                this.handleReload(e);
                break;

            default:
                this.handleDefault(e);
                break;
        }

        window.navigation.onnavigatesuccess = this.onNavigateSuccess;
    }

    private handleReplace(e: NavigateEvent) {
        const screenStack = this.state.screenStack;
        const destinationPathname = new URL(e.destination.url).pathname;
        const destinationScreen = this.screenChildFromPathname(destinationPathname);
        if (!isValidScreenChild<Screen>(destinationScreen)) return e.preventDefault();
        const handler = async () => {
            const { params, config } = e.destination.getState() as HistoryEntryState ?? {};
            const transition = window.navigation.transition;
            const destination = e.destination;
            const resolvedPathname = new URL(e.destination.url).pathname;
            const queryParams = searchParamsToObject(new URL(destination.url).search);
            const currentIndex = screenStack.findIndex(screen => screen.key === this.navigation.current.key);
            screenStack.splice(
                currentIndex,
                1, // Remove all screens after current
                cloneElement(destinationScreen, {
                    config: {
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

            return new Promise<void>((resolve) => startTransition(() => {
                this.setState({ destination, transition, screenStack }, async () => {
                    const signal = e.signal;
                    const currentScreen = this.getScreenRefByKey(this.navigation.current.key);
                    await this.setZIndices();
                    await currentScreen?.current?.focus();
                    await currentScreen?.current?.onEnter(signal);
                    await currentScreen?.current?.load(signal);
                    await currentScreen?.current?.onEntered(signal);
                    this.setState({ destination: null, transition: null }, resolve);
                });
            }));
        };

        e.intercept({ handler });
    }

    private handleReload(e: NavigateEvent) {
        const handler = async () => {
            const transition = window.navigation.transition;
            const destination = e.destination;
            const screenStack = new Array<ScreenChild<ScreenProps, Screen>>();
            let initialPathMatched = false;
            this.navigation.entries.forEach(entry => {
                if (!entry.url) return null;
                if (this.props.config.initialPath) {
                    initialPathMatched = Boolean(matchRoute(
                        this.props.config.initialPath,
                        entry.url.pathname,
                        this.baseURLPattern.pathname
                    )) || initialPathMatched;
                }
                const screen = this.screenChildFromPathname(entry.url.pathname);
                if (!isValidScreenChild<Screen>(screen)) return null;
                const { params, config } = entry.getState() as HistoryEntryState ?? {};
                const queryParams = searchParamsToObject(entry.url.search);
                screenStack.push(
                    cloneElement(screen, {
                        config: {
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

            return new Promise<void>((resolve) => startTransition(() => {
                this.setState({ screenStack, transition, destination }, async () => {
                    if (isFirstLoad(e.info) && !initialPathMatched) {
                        transition?.finished.then(() => {
                            if (!this.props.config.initialPath) return;
                            this.navigation.replace(this.props.config.initialPath).finished.then(() => {
                                const state = e.destination.getState() as HistoryEntryState ?? {};
                                this.navigation.push(e.destination.url, state);
                            });
                        });
                        return resolve();
                    }
                    const signal = e.signal;
                    const currentScreen = this.getScreenRefByKey(this.navigation.current.key);
                    await this.setZIndices();
                    await currentScreen?.current?.focus();
                    await currentScreen?.current?.onEnter(signal);
                    await currentScreen?.current?.load(signal);
                    await currentScreen?.current?.onEntered(signal);
                    this.setState({ destination: null, transition: null }, resolve);
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
        const handler = async () => {
            const { params, config } = e.destination.getState() as HistoryEntryState ?? {};
            const transition = window.navigation.transition;
            const destination = e.destination;
            const resolvedPathname = new URL(e.destination.url).pathname;
            const fromIndex = screenStack.findIndex(screen => screen.key === transition?.from.key);
            const destinationIndex = screenStack.findIndex(screen => screen.key === e.destination.key);
            const backNavigating = destinationIndex >= 0 && destinationIndex < fromIndex;
            if (e.navigationType === "push") {
                const queryParams = searchParamsToObject(new URL(destination.url).search);
                screenStack.splice(
                    fromIndex + 1,
                    Infinity, // Remove all screens after current
                    cloneElement(destinationScreen, {
                        config: {
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

            return new Promise<void>((resolve) => startTransition(() => {
                this.setState({ destination, transition, screenStack }, async () => {
                    const signal = e.signal;
                    const outgoingKey = transition?.from.key;
                    const incomingKey = window.navigation.currentEntry?.key;
                    const outgoingScreen = this.getScreenRefByKey(String(outgoingKey));
                    const incomingScreen = this.getScreenRefByKey(String(incomingKey));
                    if (!backNavigating) await this.setZIndices();
                    await Promise.all([
                        outgoingScreen?.current?.blur(),
                        incomingScreen?.current?.focus()
                    ]);
                    await Promise.all([
                        outgoingScreen?.current?.onExit(signal),
                        incomingScreen?.current?.onEnter(signal)
                    ]);
                    await incomingScreen?.current?.load(signal);
                    const animation = this.screenTransition(incomingScreen, outgoingScreen, backNavigating);
                    signal.addEventListener('abort', () => animation?.cancel());
                    await animation?.finished;
                    if (backNavigating) await this.setZIndices();
                    await Promise.all([
                        outgoingScreen?.current?.onExited(signal),
                        incomingScreen?.current?.onEntered(signal)
                    ]);
                    this.setState({ destination: null, transition: null }, resolve);
                });
            }));
        }

        e.intercept({ handler });
    }

    private screenTransition(
        incomingScreen: React.RefObject<Screen> | null,
        outgoingScreen: React.RefObject<Screen> | null,
        backNavigating: boolean
    ) {
        if (this.screenTransitionLayer.current && incomingScreen && outgoingScreen) {
            this.screenTransitionLayer.current.direction = backNavigating ? 'reverse' : 'normal';
            if (incomingScreen.current?.screenTransitionProvider.current) {
                incomingScreen.current.screenTransitionProvider.current.index = clamp(incomingScreen.current.screenTransitionProvider.current?.state.zIndex, 0, 1);
                incomingScreen.current.screenTransitionProvider.current.exiting = false;
            }
            if (outgoingScreen.current?.screenTransitionProvider.current) {
                outgoingScreen.current.screenTransitionProvider.current.index = clamp(outgoingScreen.current.screenTransitionProvider.current.state.zIndex, 0, 1);
                outgoingScreen.current.screenTransitionProvider.current.exiting = true;
            }
            if (this.screenTransitionLayer.current.sharedElementTransitionLayer.current) {
                this.screenTransitionLayer.current.sharedElementTransitionLayer.current.outgoingScreen = outgoingScreen;
                this.screenTransitionLayer.current.sharedElementTransitionLayer.current.incomingScreen = incomingScreen;
            }
            this.screenTransitionLayer.current.screens = [
                incomingScreen,
                outgoingScreen
            ];

            return this.screenTransitionLayer.current.transition();
        }
    }

    private onNavigateSuccess = () => {
        // so we can check entries later
        const { routerIds = [], ...state } = window.navigation.currentEntry?.getState() as HistoryEntryState ?? {};
        if (!routerIds.includes(this.id))
            routerIds.push(this.id);
        window.navigation.updateCurrentEntry({
            state: {
                ...state,
                routerIds
            }
        });
    }
}