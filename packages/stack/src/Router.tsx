import { RouterBase, ScreenBase, clamp, includesRoute, isValidScreenChild, matchRoute } from '@react-motion-router/core';
import type { NestedRouterContext, PlainObject, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen } from './Screen';
import { HistoryEntryState, isRefObject } from './common/types';
import { Children, createRef, cloneElement, startTransition } from 'react';

export interface RouterProps extends RouterBaseProps {
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
    screenStack: ScreenChild<ScreenProps, Screen>[]
}

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    public readonly paramsSerializer = this.props.config.paramsSerializer;
    public readonly paramsDeserializer = this.props.config.paramsDeserializer;
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);

        const navigation = new Navigation(this);
        this.state.navigation = navigation;
        this.state.screenStack = [];
    }

    protected get screens() {
        return this.state.screenStack
            .filter(screen => {
                const ref = screen.ref ?? null;
                return isRefObject(ref) && ref.current?.routeData.config.keepAlive
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
                if (ref && isRefObject(ref) && ref.current?.screenAnimationProvider) {
                    return ref.current.screenAnimationProvider.setZIndex(zIndex);
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
                const screenStack = new Array<ScreenChild>();
                this.navigation.entries.forEach(entry => {
                if (!entry.url) return null;
                const screen = this.screenChildFromPathname(entry.url.pathname);
                if (!isValidScreenChild(screen)) return null;
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
                        ref: createRef<ScreenBase>()
                    })
                );
            });

            return new Promise<void>((resolve) => startTransition(() => {
                this.setState({ screenStack, transition, destination }, async () => {
                    const currentScreen = this.getScreenRefByKey(this.navigation.current.key);
                    await this.setZIndices();
                    await currentScreen?.current?.focus();
                    await currentScreen?.current?.onEnter();
                    await currentScreen?.current?.load();
                    await currentScreen?.current?.onEntered();
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
        if (!isValidScreenChild(destinationScreen)) return e.preventDefault();
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
                        ref: createRef<ScreenBase>()
                    })
                );
            }

            return new Promise<void>((resolve) => startTransition(() => {
                this.setState({ destination, transition, screenStack }, async () => {
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
                        outgoingScreen?.current?.onExit(),
                        incomingScreen?.current?.onEnter()
                    ]);
                    await Promise.all([
                        this.animate(incomingScreen, outgoingScreen, backNavigating),
                        this.sharedElementTransition(incomingScreen, outgoingScreen)
                    ]);
                    await incomingScreen?.current?.load();
                    if (backNavigating) await this.setZIndices();
                    await Promise.all([
                        outgoingScreen?.current?.onExited(),
                        incomingScreen?.current?.onEntered()
                    ]);
                    this.setState({ destination: null, transition: null }, resolve);
                });
            }));
        }

        e.intercept({ handler });
    }

    private async sharedElementTransition(
        incomingScreen: React.RefObject<Screen> | null,
        outgoingScreen: React.RefObject<Screen> | null
    ) {
        if (this.sharedElementLayer.current && incomingScreen && outgoingScreen) {
            this.sharedElementLayer.current.outgoingScreen = outgoingScreen;
            this.sharedElementLayer.current.incomingScreen = incomingScreen;
            this.sharedElementLayer.current.transition();
        }
    }

    private async animate(
        incomingScreen: React.RefObject<Screen> | null,
        outgoingScreen: React.RefObject<Screen> | null,
        backNavigating: boolean
    ) {
        if (this.screenAnimationLayer.current && incomingScreen && outgoingScreen) {
            this.screenAnimationLayer.current.direction = backNavigating ? 'reverse' : 'normal';
            if (incomingScreen.current?.screenAnimationProvider) {
                incomingScreen.current.screenAnimationProvider.index = clamp(incomingScreen.current.screenAnimationProvider.state.zIndex, 0, 1);
                incomingScreen.current.screenAnimationProvider.exiting = false;
            }
            if (outgoingScreen.current?.screenAnimationProvider) {
                outgoingScreen.current.screenAnimationProvider.index = clamp(outgoingScreen.current.screenAnimationProvider.state.zIndex, 0, 1);
                outgoingScreen.current.screenAnimationProvider.exiting = true;
            }
            this.screenAnimationLayer.current.screens = [
                incomingScreen,
                outgoingScreen
            ];
            await this.screenAnimationLayer.current.animate();
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