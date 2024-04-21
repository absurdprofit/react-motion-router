import { RouterBase, ScreenBase, includesRoute, isValidScreenChild, matchRoute } from '@react-motion-router/core';
import type { NestedRouterContext, PlainObject, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen } from './Screen';
import { HistoryEntryState } from './common/types';
import { Children, createRef, isValidElement, cloneElement } from 'react';

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

    protected get children() {
        return this.state.screenStack
            .filter(screen => {
                return screen.props.config?.keepAlive
                    || screen.key === this.navigation.current.key
                    || screen.key === this.state.transition?.from.key
                    || screen.key === this.state.destination?.key;
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
        if (
            screen !== null
            && typeof screen === 'object'
            && screen.hasOwnProperty('current')
        ) return screen;
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
        
        switch(e.navigationType) {
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
            return new Promise<void>((resolve) => {
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

                this.setState({ screenStack }, async () => {
                    const currentScreen = this.getScreenRefByKey(this.navigation.current.key);
                    await currentScreen?.current?.animationProvider?.setZIndex(1);
                    await currentScreen?.current?.load();
                    resolve();
                });
            });
        }

        e.intercept({ handler });
    }

    private handleDefault(e: NavigateEvent) {
        const destinationPathname = new URL(e.destination.url).pathname;
        const currentIndex = window.navigation.currentEntry?.index ?? 0;
        const destinationIndex = e.destination.index;
        const backNavigating = destinationIndex >= 0 && destinationIndex < currentIndex;
        const screen = this.screenChildFromPathname(destinationPathname);
        const screenStack = this.state.screenStack;
        const handler = async () => {
            const { params, config } = e.destination.getState() as HistoryEntryState ?? {};
            const transition = window.navigation.transition;
            const destination = e.destination;
            const resolvedPathname = new URL(e.destination.url).pathname;
            if (e.navigationType !== "traverse") {
                if (isValidScreenChild(screen)) {
                    screenStack.splice(
                        destinationIndex,
                        screenStack.length - destinationIndex,
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
                            resolvedPathname,
                            key: window.navigation.currentEntry?.key,
                            ref: createRef<ScreenBase>()
                        })
                    );
                } else {
                    return e.preventDefault();
                }
            }

            return new Promise<void>((resolve) => this.setState({ destination, transition, screenStack }, async () => {
                const outgoingKey = transition?.from.key;
                const incomingKey = window.navigation.currentEntry?.key;
                const outgoingScreen = this.getScreenRefByKey(String(outgoingKey));
                const incomingScreen = this.getScreenRefByKey(String(incomingKey));
                if (backNavigating) {
                    await Promise.all([
                        incomingScreen?.current?.animationProvider?.setZIndex(0),
                        outgoingScreen?.current?.animationProvider?.setZIndex(1)
                    ]);
                } else {
                    await Promise.all([
                        incomingScreen?.current?.animationProvider?.setZIndex(1),
                        outgoingScreen?.current?.animationProvider?.setZIndex(0)
                    ]);
                }
                if (this.animationLayer.current && incomingScreen && outgoingScreen) {
                    this.animationLayer.current.direction = backNavigating ? 'reverse' : 'normal';
                    this.animationLayer.current.screens = [
                        incomingScreen,
                        outgoingScreen
                    ];
                    this.animationLayer.current?.animate();
                    await this.animationLayer.current?.finished;
                }
                await incomingScreen?.current?.load();
                await incomingScreen?.current?.animationProvider?.setZIndex(1);
                this.setState({ destination: null, transition: null }, resolve);
            }));
        }

        e.intercept({ handler });
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