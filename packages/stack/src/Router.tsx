import { RouterBase, includesRoute, matchRoute } from '@react-motion-router/core';
import type { NestedRouterContext, PlainObject, RouterBaseProps, RouterBaseState, ScreenChild } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps, Screen } from './Screen';
import { NavigateEventRouterState } from './common/types';
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

export interface RouterState extends RouterBaseState {
    backNavigating: boolean;
    nextParams?: PlainObject;
    nextConfig?: ScreenProps["config"];
    transition: NavigationTransition | null;
}

function StateFromChildren(
    props: RouterProps,
    state: RouterState,
) {
    let { currentPath, nextPath } = state;
    const baseURLPattern = state.navigation.baseURLPattern.pathname;
    const isFirstLoad = (props.children === state.children) || Children.count(state.children) === 0;
    let nextMatched = false;
    let currentMatched = false;
    let documentTitle: string = state.defaultDocumentTitle;
    let currentScreen = state.currentScreen;
    let nextScreen = state.nextScreen;

    const children: ScreenChild[] = [];
    let keptAliveKey: React.Key | undefined = undefined;
    if (currentPath) {
        // get current child
        Children.forEach(
            state.children, // match current child from state
            (child) => {
                if (!isValidElement(child)) return;
                if (
                    typeof nextPath === "string"
                    && typeof child.props.resolvedPathname === "string"
                    && matchRoute(child.props.resolvedPathname, nextPath, baseURLPattern, child.props.caseSensitive)) {
                    // fetch kept alive key
                    // needed since elements kept alive are apart of the DOM
                    // to avoid confusing react we need to preserve this key
                    if (child.props.config?.keepAlive) {
                        keptAliveKey = child.key || undefined;
                    }
                }

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
                            key: child.key ?? Math.random(),
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
                    const key = keptAliveKey || Math.random();
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
                            key,
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
        if (props.config.disableBrowserRouting) {
            const initialRoute = new URL(props.config.initialRoute ?? '.', this.baseURL);
            this.state.currentPath = initialRoute.pathname;
        } else {
            this.state.currentPath = new URL(window.navigation.currentEntry!.url!).pathname;
        }
        this.state.backNavigating = false;
    }

    static getDerivedStateFromProps(props: RouterProps, state: RouterState) {
        return StateFromChildren(props, state);
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
            && !e.downloadRequest
            && e.navigationType !== "reload";
    }

    protected intercept(e: NavigateEvent): void {
        if (this.props.config.onIntercept)
            if (this.props.config.onIntercept(e) || e.defaultPrevented)
                return;

        const currentPath = this.state.currentPath;
        const nextPath = new URL(e.destination.url).pathname;
        const currentIndex = window.navigation.currentEntry?.index ?? 0;
        const destinationIndex = e.destination.index;
        const backNavigating = destinationIndex >= 0 && destinationIndex < currentIndex;
        const { params: nextParams, config: nextConfig } = e.destination.getState() as NavigateEventRouterState ?? {};
        if (this.animationLayer.current)
            this.animationLayer.current.direction = backNavigating ? 'reverse' : 'normal';
        const handler = async () => {
            const transition = window.navigation.transition;
            transition?.finished.then(this.onTransitionEnd);
            if (currentPath !== nextPath && e.navigationType !== "replace") {
                this.setState({
                    nextPath,
                    backNavigating,
                    nextParams,
                    nextConfig,
                    transition
                }, this.onNextPathChange);
            } else {
                this.setState({
                    nextParams,
                    nextConfig,
                    transition
                }, this.onCurrentStateChange);
            }

            await this.animationLayer.current?.finished;
            await this.state.nextScreen?.current?.load();
            this.setState({
                currentPath: nextPath,
                nextPath: undefined,
                nextParams: undefined,
                nextConfig: undefined,
                transition: null,
                backNavigating: false
            });
        }
        if (this.props.config.disableBrowserRouting) {
            e.preventDefault();
            handler();
        } else {
            e.intercept({ handler });
        }
    }

    private onCurrentStateChange = async () => {
        const currentScreen = this.state.currentScreen?.current;
        if (currentScreen) {
            const path = currentScreen.props.path;
            const routeData = this.routesData.get(path);
            this.routesData.set(path, {
                params: { ...routeData?.params, ...this.state.nextParams },
                config: { ...routeData?.config, ...this.state.nextConfig },
            });
        }
    }

    private onNextPathChange = async () => {
        const nextScreen = this.state.nextScreen?.current;
        const currentScreen = this.state.currentScreen?.current;
        if (nextScreen) {
            const path = nextScreen.props.path;
            const routeData = this.routesData.get(path);
            this.routesData.set(path, {
                params: { ...routeData?.params, ...this.state.nextParams },
                config: { ...routeData?.config, ...this.state.nextConfig },
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
    }

    private onTransitionEnd = () => {
        // so we can check entries later
        window.navigation.updateCurrentEntry({
            state: {
                ...window.navigation.currentEntry?.getState() ?? {},
                routerId: this.id
            }
        });
    }
}