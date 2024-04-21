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

// function StateFromChildren(
//     props: RouterProps,
//     state: RouterState,
// ) {
//     let { previousPath, currentPath, nextPath, currentScreenKey, previousScreenKey } = state;
//     const baseURLPattern = state.navigation.baseURLPattern.pathname;
//     const isFirstLoad = Children.count(state.children) === 0;
//     let nextMatched = false;
//     let currentMatched = false;
//     let previousMatched = false;
//     let documentTitle: string = state.defaultDocumentTitle;
//     let previousScreen = state.previousScreen;
//     let currentScreen = state.currentScreen;
//     let nextScreen = state.nextScreen;

//     const children: ScreenChild[] = [];
//     if (previousPath) {
//         // get previous child
//         Children.forEach(
//             state.children, // match previous child from state
//             (child) => {
//                 if (!isValidElement(child)) return;
//                 if (previousMatched || !child.props.resolvedPathname) return;
//                 // match resolved pathname instead to avoid matching the next component first
//                 // this can happen if the same component matches both current and next paths
//                 const matchInfo = matchRoute(child.props.resolvedPathname, previousPath, baseURLPattern, child.props.caseSensitive);
//                 if (matchInfo && child.props.config?.keepAlive) {
//                     previousMatched = true;
//                     previousScreen = createRef<Screen>();
//                     children.push(
//                         cloneElement(child, {
//                             in: false,
//                             out: false,
//                             config: {
//                                 ...props.config.screenConfig,
//                                 ...child.props.config
//                             },
//                             defaultParams: {
//                                 ...child.props.defaultParams,
//                                 ...matchInfo.params,
//                             },
//                             resolvedPathname: previousPath,
//                             key: previousScreenKey,
//                             ref: previousScreen
//                         })
//                     );
//                 }
//             }
//         );
//     }

//     if (currentPath) {
//         // get current child
//         Children.forEach(
//             isFirstLoad ? props.children : state.children, // match current child from state
//             (child) => {
//                 if (!isValidElement(child)) return;
//                 if (currentMatched) return;
//                 // match resolved pathname instead to avoid matching the next component first
//                 // this can happen if the same component matches both current and next paths
//                 let matchInfo;
//                 if (isFirstLoad) {
//                     // first load so resolve by path instead of resolvedPathname
//                     matchInfo = matchRoute(child.props.path, currentPath, baseURLPattern, child.props.caseSensitive);
//                 } else if (typeof child.props.resolvedPathname === "string") {
//                     matchInfo = matchRoute(child.props.resolvedPathname, currentPath, baseURLPattern, child.props.caseSensitive);
//                 } else {
//                     return;
//                 }
//                 if (matchInfo) {
//                     currentMatched = true;
//                     currentScreen = createRef<Screen>();
//                     children.push(
//                         cloneElement(child, {
//                             in: isFirstLoad,
//                             out: !isFirstLoad,
//                             config: {
//                                 ...props.config.screenConfig,
//                                 ...child.props.config
//                             },
//                             defaultParams: {
//                                 ...child.props.defaultParams,
//                                 ...matchInfo.params,
//                             },
//                             resolvedPathname: currentPath,
//                             key: currentScreenKey,
//                             ref: currentScreen
//                         })
//                     );
//                 }
//             }
//         );
//     }

//     if (nextPath) {
//         // get next child
//         Children.forEach(
//             props.children,
//             (child) => {
//                 if (!isValidElement(child)) return;
//                 if (typeof nextPath !== 'string') return;
//                 if (nextMatched) return;
//                 const matchInfo = matchRoute(child.props.path, nextPath, baseURLPattern, child.props.caseSensitive);
//                 if (matchInfo) {
//                     nextMatched = true;
//                     documentTitle = child.props.config?.title || state.defaultDocumentTitle;
//                     nextScreen = createRef<Screen>();
//                     children.push(
//                         cloneElement(child, {
//                             in: true,
//                             out: false,
//                             config: {
//                                 ...props.config.screenConfig,
//                                 ...child.props.config
//                             },
//                             defaultParams: {
//                                 ...child.props.defaultParams,
//                                 ...matchInfo.params,
//                             },
//                             resolvedPathname: nextPath,
//                             key: Math.random(),
//                             ref: nextScreen
//                         })
//                     );
//                 }
//             }
//         );
//     }

//     return {
//         children,
//         documentTitle,
//         currentScreen,
//         nextScreen
//     }
// }

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    public readonly paramsSerializer = this.props.config.paramsSerializer;
    public readonly paramsDeserializer = this.props.config.paramsDeserializer;
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);

        const navigation = new Navigation(this);
        this.state.navigation = navigation;
        this.state.screenStack = [];
    }

    // static getDerivedStateFromProps(props: RouterProps, state: RouterState) {
    //     return StateFromChildren(props, state);
    // }

    protected get children() {
        return this.state.screenStack
            .filter(screen => {
                return screen.props.config?.keepAlive
                    || screen.key === this.navigation.current.key
                    || screen.key === this.state.transition?.from.key
                    || screen.key === this.state.destination?.key;
            });
    }

    private screenFromPathname(pathname: string) {
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
        if (e.destination.index === this.navigation.index) {
            this.handleReload(e);
        } else {
            this.handleDefault(e);
        }
    }

    private handleReload(e: NavigateEvent) {
        const handler = async () => {
            return new Promise<void>((resolve) => {
                const screenStack = new Array<ScreenChild>();
                this.navigation.entries.forEach(entry => {
                    if (!entry.url) return null;
                    const screen = this.screenFromPathname(entry.url.pathname);
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
                    await currentScreen?.current?.animationProvider?.setZIndex(1)
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
        const screen = this.screenFromPathname(destinationPathname);
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
                            key: destination.key,
                            ref: createRef<ScreenBase>()
                        })
                    );
                } else {
                    return e.preventDefault();
                }
            }

            transition?.finished.then(() => {
                if (destination.key === "" && isValidScreenChild(screen)) {
                    screenStack.splice(
                        destinationIndex,
                        1,
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
                }
                this.setState({ screenStack, destination: null, transition: null });
            });

            return new Promise<void>((resolve) => this.setState({ destination, transition, screenStack }, async () => {
                const outgoingKey = transition?.from.key;
                const incomingKey = destination.key;
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
                resolve();
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