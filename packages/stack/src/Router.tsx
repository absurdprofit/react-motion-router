import { RouterBase, clamp, includesRoute, isValidScreenChild, matchRoute } from '@react-motion-router/core';
import type { NestedRouterContext, PlainObject, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen } from './Screen';
import { HistoryEntryState, isHorizontalDirection, isRefObject, SwipeDirection } from './common/types';
import { Children, createRef, cloneElement, startTransition } from 'react';
import { SwipeStartEvent, SwipeEndEvent } from 'web-gesture-events';
import { GestureTimeline } from 'web-animations-extension';

export interface RouterProps extends RouterBaseProps<Screen> {
    config: RouterBaseProps["config"] & {
        screenConfig?: ScreenProps["config"];
        disableBrowserRouting?: boolean;
        initialRoute?: string;
        paramsSerializer?(params: PlainObject): string;
        paramsDeserializer?(queryString: string): PlainObject;
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
    public readonly paramsSerializer = this.props.config.paramsSerializer;
    public readonly paramsDeserializer = this.props.config.paramsDeserializer;
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);

        this.state = {
            navigation: new Navigation(this),
            screenStack: [],
            gestureDirection: "horizontal",
            gestureAreaWidth: 30,
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
        this.ref?.addEventListener('swipestart', this.onSwipeStart);
        this.ref?.addEventListener('swipeend', this.onSwipeEnd);
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        this.ref?.removeEventListener('swipestart', this.onSwipeStart);
        this.ref?.removeEventListener('swipeend', this.onSwipeEnd);
    }

    private canGestureNavigate(e: SwipeStartEvent) {
        if (this.state.disableGesture) return false;
        const { direction } = e;
        if ((direction === "down" || direction === "right") && !this.navigation.canGoBack) return false;
        if ((direction === "up" || direction === "left") && !this.navigation.canGoForward) return false;
        if (
            this.state.gestureDirection !== direction
            && isHorizontalDirection(direction) !== isHorizontalDirection(this.state.gestureDirection)
        ) return false;
        return true;
    }

    private onSwipeStart = (e: SwipeStartEvent) => {
        // TODO: factor in gesture region
        if (!this.canGestureNavigate(e)) return;
        if (!this.ref || !this.screenTransitionLayer.current) return;
        const { direction } = e;

        let axis: "x" | "y" = "x";
        switch (this.state.gestureDirection) {
            case "up":
            case "down":
            case "vertical":
                axis = "y";
                break;
        }
        let rangeStart;
        let rangeEnd;
        switch (direction) {
            case "right":
                rangeStart = 0;
                rangeEnd = this.ref.clientWidth;
            break;
            case "left":
                rangeStart = this.ref.clientWidth;
                rangeEnd = 0;
            break;
            case "down":
                rangeStart = 0;
                rangeEnd = this.ref.clientHeight;
            break;
            case "up":
                rangeStart = this.ref.clientHeight;
                rangeEnd = 0;
            break;
        }
        this.screenTransitionLayer.current.timeline = new GestureTimeline({
            source: this.ref,
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
        this.screenTransitionLayer.current.timeline = document.timeline;
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
                if (ref && isRefObject(ref) && ref.current?.screenTransitionProvider) {
                    return ref.current.screenTransitionProvider.setZIndex(zIndex);
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
        const handler = async () => {
            if (e.destination.url === window.navigation.transition?.from.url) {
                return this.handleReload(e);
            } else {
                return this.handleDefault(e);
            }
        };
        e.intercept({ handler });
    }

    private handleReload(e: NavigateEvent) {
        const handler = async () => {
            const transition = window.navigation.transition;
            const destination = e.destination;
            const screenStack = new Array<ScreenChild<ScreenProps, Screen>>();
            this.navigation.entries.forEach(entry => {
                if (!entry.url) return null;
                const screen = this.screenChildFromPathname(entry.url.pathname);
                if (!isValidScreenChild<Screen>(screen)) return null;
                const { params, config } = entry.getState() as HistoryEntryState ?? {};
                screenStack.push(
                    cloneElement(screen, {
                        config: {
                            ...this.props.config.screenConfig,
                            ...screen.props.config,
                            ...config
                        },
                        defaultParams: {
                            ...screen.props.defaultParams,
                            ...params,
                        },
                        resolvedPathname: entry.url.pathname,
                        key: entry.key,
                        ref: createRef<Screen>()
                    })
                );
            });

            return new Promise<void>((resolve) => startTransition(() => {
                this.setState({ screenStack, transition, destination }, async () => {
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
            if (e.navigationType === "push" || e.navigationType === "replace") {
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
            if (incomingScreen.current?.screenTransitionProvider) {
                incomingScreen.current.screenTransitionProvider.index = clamp(incomingScreen.current.screenTransitionProvider.state.zIndex, 0, 1);
                incomingScreen.current.screenTransitionProvider.exiting = false;
            }
            if (outgoingScreen.current?.screenTransitionProvider) {
                outgoingScreen.current.screenTransitionProvider.index = clamp(outgoingScreen.current.screenTransitionProvider.state.zIndex, 0, 1);
                outgoingScreen.current.screenTransitionProvider.exiting = true;
            }
            if (this.screenTransitionLayer.current.sharedElementLayer.current) {
                this.screenTransitionLayer.current.sharedElementLayer.current.outgoingScreen = outgoingScreen;
                this.screenTransitionLayer.current.sharedElementLayer.current.incomingScreen = incomingScreen;
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