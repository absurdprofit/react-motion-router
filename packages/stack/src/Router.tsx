import { RouterBase, includesRoute, matchRoute } from '@react-motion-router/core';
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

export interface RouterState extends RouterBaseState<Screen, Navigation> {
    backNavigating: boolean;
    transition: NavigationTransition | null;
    previousScreenKey?: string;
    currentScreenKey?: string;
    nextPath?: string;
    currentPath?: string;
    previousPath?: string;
}

function StateFromChildren(
    props: RouterProps,
    state: RouterState,
) {
    let { previousPath, currentPath, nextPath, currentScreenKey, previousScreenKey } = state;
    const baseURLPattern = state.navigation.baseURLPattern.pathname;
    const isFirstLoad = Children.count(state.children) === 0;
    let nextMatched = false;
    let currentMatched = false;
    let previousMatched = false;
    let documentTitle: string = state.defaultDocumentTitle;
    let previousScreen = state.previousScreen;
    let currentScreen = state.currentScreen;
    let nextScreen = state.nextScreen;

    const children: ScreenChild[] = [];
    if (previousPath) {
        // get previous child
        Children.forEach(
            state.children, // match previous child from state
            (child) => {
                if (!isValidElement(child)) return;
                if (previousMatched || !child.props.resolvedPathname) return;
                // match resolved pathname instead to avoid matching the next component first
                // this can happen if the same component matches both current and next paths
                const matchInfo = matchRoute(child.props.resolvedPathname, previousPath, baseURLPattern, child.props.caseSensitive);
                if (matchInfo && child.props.config?.keepAlive) {
                    previousMatched = true;
                    previousScreen = createRef<Screen>();
                    children.push(
                        cloneElement(child, {
                            in: false,
                            out: false,
                            config: {
                                ...props.config.screenConfig,
                                ...child.props.config
                            },
                            defaultParams: {
                                ...child.props.defaultParams,
                                ...matchInfo.params,
                            },
                            resolvedPathname: previousPath,
                            key: previousScreenKey,
                            ref: previousScreen
                        })
                    );
                }
            }
        );
    }

    if (currentPath) {
        // get current child
        Children.forEach(
            isFirstLoad ? props.children : state.children, // match current child from state
            (child) => {
                if (!isValidElement(child)) return;
                if (currentMatched) return;
                // match resolved pathname instead to avoid matching the next component first
                // this can happen if the same component matches both current and next paths
                let matchInfo;
                if (isFirstLoad) {
                    // first load so resolve by path instead of resolvedPathname
                    matchInfo = matchRoute(child.props.path, currentPath, baseURLPattern, child.props.caseSensitive);
                } else if (typeof child.props.resolvedPathname === "string") {
                    matchInfo = matchRoute(child.props.resolvedPathname, currentPath, baseURLPattern, child.props.caseSensitive);
                } else {
                    return;
                }
                if (matchInfo) {
                    currentMatched = true;
                    currentScreen = createRef<Screen>();
                    children.push(
                        cloneElement(child, {
                            in: isFirstLoad,
                            out: !isFirstLoad,
                            config: {
                                ...props.config.screenConfig,
                                ...child.props.config
                            },
                            defaultParams: {
                                ...child.props.defaultParams,
                                ...matchInfo.params,
                            },
                            resolvedPathname: currentPath,
                            key: currentScreenKey,
                            ref: currentScreen
                        })
                    );
                }
            }
        );
    }

    if (nextPath) {
        // get next child
        Children.forEach(
            props.children,
            (child) => {
                if (!isValidElement(child)) return;
                if (typeof nextPath !== 'string') return;
                if (nextMatched) return;
                const matchInfo = matchRoute(child.props.path, nextPath, baseURLPattern, child.props.caseSensitive);
                if (matchInfo) {
                    nextMatched = true;
                    documentTitle = child.props.config?.title || state.defaultDocumentTitle;
                    nextScreen = createRef<Screen>();
                    children.push(
                        cloneElement(child, {
                            in: true,
                            out: false,
                            config: {
                                ...props.config.screenConfig,
                                ...child.props.config
                            },
                            defaultParams: {
                                ...child.props.defaultParams,
                                ...matchInfo.params,
                            },
                            resolvedPathname: nextPath,
                            key: Math.random(),
                            ref: nextScreen
                        })
                    );
                }
            }
        );
    }

    return {
        children,
        documentTitle,
        currentScreen,
        nextScreen
    }
}

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    public readonly paramsSerializer = this.props.config.paramsSerializer;
    public readonly paramsDeserializer = this.props.config.paramsDeserializer;
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);

        const navigation = new Navigation(this);
        this.state.navigation = navigation;
    }

    static getDerivedStateFromProps(props: RouterProps, state: RouterState) {
        return StateFromChildren(props, state);
    }

    protected get children() {
        return this.state.children;
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
        const currentPath = this.state.currentPath;
        const nextPath = new URL(e.destination.url).pathname;
        const { params: nextParams, config: nextConfig } = e.destination.getState() as HistoryEntryState ?? {};
        if (currentPath === nextPath) {
            const currentScreen = this.state.currentScreen?.current;
            if (currentScreen) {
                const path = currentScreen.props.path;
                const routeData = this.routesData.get(path);
                this.routesData.set(path, {
                    params: { ...routeData?.params, ...nextParams },
                    config: { ...routeData?.config, ...nextConfig },
                });
            }
            e.intercept({ handler: () => Promise.resolve() });
        } else {
            this.handleDefault(e);
        }
    }

    private handleReload(e: NavigateEvent) {
        const currentPath = new URL(e.destination.url).pathname;
        const { params: currentParams, config: currentConfig } = e.destination.getState() as HistoryEntryState ?? {};

        const handler = async () => {
            return new Promise<void>((resolve) => {
                const transition = window.navigation.transition;
                this.setState({
                    currentScreenKey: window.navigation.currentEntry?.key,
                    currentPath,
                    transition
                }, async () => {
                    const currentScreen = this.state.currentScreen?.current;
                    if (!currentScreen) return;
                    const path = currentScreen.props.path;
                    const routeData = this.routesData.get(path);
                    this.routesData.set(path, {
                        params: { ...routeData?.params, ...currentParams },
                        config: { ...routeData?.config, ...currentConfig },
                    });

                    await currentScreen?.animationProvider?.setZIndex(1)
                    await currentScreen.load();
                    resolve();
                });
            });
        }

        e.intercept({ handler });
    }

    private handleDefault(e: NavigateEvent) {
        const currentPath = this.state.currentPath;
        const nextPath = new URL(e.destination.url).pathname;
        const currentIndex = window.navigation.currentEntry?.index ?? 0;
        const destinationIndex = e.destination.index;
        const backNavigating = destinationIndex >= 0 && destinationIndex < currentIndex;
        const { params: nextParams, config: nextConfig } = e.destination.getState() as HistoryEntryState ?? {};
        if (this.animationLayer.current)
            this.animationLayer.current.direction = backNavigating ? 'reverse' : 'normal';
        const handler = async () => {
            return new Promise<void>(async (resolve) => {
                this.setState({
                    nextPath,
                    backNavigating,
                }, async () => {
                    const nextScreen = this.state.nextScreen?.current;
                    const currentScreen = this.state.currentScreen?.current;
                    if (nextScreen) {
                        const path = nextScreen.props.path;
                        const routeData = this.routesData.get(path);
                        this.routesData.set(path, {
                            params: { ...routeData?.params, ...nextParams },
                            config: { ...routeData?.config, ...nextConfig },
                        });
                    }
            
                    if (this.state.backNavigating) {
                        await Promise.all([
                            nextScreen?.animationProvider?.setZIndex(0),
                            currentScreen?.animationProvider?.setZIndex(1)
                        ]);
                    } else {
                        await Promise.all([
                            nextScreen?.animationProvider?.setZIndex(1),
                            currentScreen?.animationProvider?.setZIndex(0)
                        ]);
                    }
                    this.animationLayer.current?.animate();
                    await this.animationLayer.current?.finished;
                    await this.state.nextScreen?.current?.load();
                    this.setState({
                        previousPath: currentPath,
                        currentPath: nextPath,
                        previousScreenKey: this.state.currentScreenKey,
                        currentScreenKey: window.navigation.currentEntry?.key,
                        nextPath: undefined,
                        transition: null,
                        backNavigating: false
                    });
                    resolve();
                });
            });
        }
        if (this.props.config.disableBrowserRouting) {
            e.preventDefault();
            handler();
        } else {
            e.intercept({ handler });
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