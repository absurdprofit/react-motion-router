import { NavigationBase } from './NavigationBase';
import { AnimationLayer } from './AnimationLayer';
import {
    ScreenChild,
    PlainObject,
    RouterEventMap,
    NavigateEventRouterState,
    RouteData
} from './common/types';
import { RouterData, RouterDataContext } from './RouterData';
import { dispatchEvent, matchRoute, resolveBaseURLFromPattern, searchParamsToObject } from './common/utils';
import { Component, RefObject, createRef } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';
import { ScreenBase, ScreenBaseProps } from './ScreenBase';
import { RouteDataContext } from './RouteData';

export interface RouterBaseProps {
    id?: string;
    config: {
        screenConfig?: ScreenBaseProps["config"];
        defaultRoute?: string;
        basePathname?: string;
        disableBrowserRouting?: boolean;
        paramsSerializer?(params: PlainObject): string;
        paramsDeserializer?(queryString: string): PlainObject;
    };
    children: ScreenChild | ScreenChild[];
}

export interface RouterBaseState<N extends NavigationBase = NavigationBase> {
    currentPath: string;
    nextPath: string | undefined;
    backNavigating: boolean;
    defaultDocumentTitle: string;
    documentTitle: string;
}

function StateFromChildren(
    currentChildren: ScreenChild | ScreenChild[],
    props: RouterBaseProps,
    state: RouterBaseState,
    baseURL: string
) {
    let { currentPath, nextPath } = state;
    const isFirstLoad = props.children === currentChildren;
    let nextMatched = false;
    let currentMatched = false;
    let documentTitle: string = state.defaultDocumentTitle;
    let currentScreen: RefObject<ScreenBase> | null = null;
    let nextScreen: RefObject<ScreenBase> | null = null;

    const children: ScreenChild[] = [];
    let keptAliveKey: React.Key | undefined = undefined;
    // get current child
    Children.forEach(
        currentChildren, // match current child from state
        (child) => {
            if (!isValidElement(child)) return;
            if (
                typeof nextPath === "string"
                && typeof child.props.resolvedPathname === "string"
                && matchRoute(child.props.resolvedPathname, nextPath, baseURL, child.props.caseSensitive)) {
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
                matchInfo = matchRoute(child.props.path, currentPath, baseURL, child.props.caseSensitive);
            } else if (typeof child.props.resolvedPathname === "string") {
                matchInfo = matchRoute(child.props.resolvedPathname, currentPath, baseURL, child.props.caseSensitive);
            } else {
                return;
            }
            if (matchInfo) {
                currentMatched = true;
                currentScreen = createRef<ScreenBase>();
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
    )

    if (!isFirstLoad) {
        // get next child
        Children.forEach(
            props.children,
            (child) => {
                if (!isValidElement(child)) return;
                if (typeof nextPath !== 'string') return;
                if (nextMatched) return;
                const matchInfo = matchRoute(child.props.path, nextPath, baseURL, child.props.caseSensitive);
                if (matchInfo) {
                    nextMatched = true;
                    documentTitle = child.props.config?.title || state.defaultDocumentTitle;
                    const key = keptAliveKey || Math.random();
                    nextScreen = createRef<ScreenBase>();
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

export abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState, N extends NavigationBase = NavigationBase> extends Component<P, S> {
    protected ref: HTMLElement | null = null;
    protected readonly routerData = new RouterData<N>(this);
    public abstract navigation: NavigationBase;
    protected animationLayer = createRef<AnimationLayer>();
    protected parentRouteData: RouteData | null = null;
    protected _currentScreen: RefObject<ScreenBase> | null = null;
    protected _nextScreen: RefObject<ScreenBase> | null = null;
    protected children: ScreenChild | ScreenChild[] = this.props.children;
    private static rootRouterRef: WeakRef<RouterBase> | null = null;
    static readonly contextType = RouterDataContext;
    context!: React.ContextType<typeof RouterDataContext>;

    static readonly defaultProps = {
        config: {
            screenConfig: {
                animation: DEFAULT_ANIMATION,
                ...DEFAULT_GESTURE_CONFIG
            }
        }
    };

    state: S = {
        defaultDocumentTitle: document.title,
        documentTitle: document.title,
        backNavigating: false,
    } as S;

    componentDidMount() {
        this.routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this.routerData.paramsSerializer = this.props.config.paramsSerializer;

        this.routerData.parentRouterData = this.context;
        if (this.isRoot) {
            RouterBase.rootRouterRef = new WeakRef(this);
            window.navigation.addEventListener('navigate', this.handleNavigationDispatch)
        }
    }

    componentWillUnmount() {
        if (this.isRoot) {
            window.navigation.removeEventListener('navigate', this.handleNavigationDispatch);
        }
    }

    private handleNavigationDispatch = (e: NavigateEvent) => {
        // for traversing existing entries routerId should be apart of the state
        let { routerId = this.id } = (e.destination.getState() ?? {}) as NavigateEventRouterState;
        if (e.userInitiated) {
            // replace with e.sourceElement when available. See https://github.com/WICG/navigation-api/issues/225
            const sourceElement = document.querySelector(`a[href="${e.destination.url}"]`);
            routerId = sourceElement?.getAttribute('data-router-id') ?? sourceElement?.closest('.react-motion-router')?.id ?? routerId;
        }
        const router = this.getRouterById(routerId);
        if (router && router.shouldIntercept(e)) {
            router.intercept(e);
            window.navigation.transition?.finished.then(() => {
                window.navigation.updateCurrentEntry({ state: { routerId: this.id } });
            });
        }
    }

    protected getRouterById(routerId: string, target?: RouterBase) {
        const router = target ?? RouterBase.rootRouterRef?.deref();
        console.log(router?.routerData.childRouterData);
        if (router!.id === routerId) {
            return router;
        } else if (router?.routerData.childRouterData) {
            this.getRouterById(routerId, router!.routerData.childRouterData.routerInstance);
        } else {
            return null;
        }
    }

    public dispatchEvent = (event: Event) => {
        const ref = this.ref ?? undefined;
        return dispatchEvent(event, ref);
    }

    public addEventListener = <K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => {
        return this.ref?.addEventListener(type, listener, options);
    }

    public removeEventListener = <K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined) => {
        return this.ref?.removeEventListener(type, listener, options);
    }

    get id() {
        if (this.props.id) return this.props.id;
        return this.baseURL.pathname
            .toLowerCase()
            .replace(/[^\w-]/g, '-') // Remove non-alphanumeric chars
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
    }

    protected get paths() {
        return Children.map(this.props.children, (child) => {
            return child.props.path;
        });
    }

    public get currentScreen() {
        return this._currentScreen?.current;
    }

    public get nextScreen() {
        return this._nextScreen?.current;
    }

    protected get parentRouterData() {
        return this.routerData.parentRouterData;
    }

    protected get isRoot() {
        return !this.parentRouterData;
    }

    get baseURL() {
        const pathname = this.isRoot ? window.location.pathname : this.parentRouteData?.resolvedPathname!;
        const pattern = this.baseURLPattern.pathname;

        return resolveBaseURLFromPattern(pattern, pathname)!;
    }

    get baseURLPattern() {
        let baseURL = window.location.origin + "/";
        const defaultBasePathname = this.isRoot ? new URL(".", document.baseURI).href.replace(baseURL, '') : ".";
        let basePathname = this.props.config.basePathname || defaultBasePathname;

        if (this.parentRouterData && this.parentRouteData) {
            const { resolvedPathname = window.location.pathname, path } = this.parentRouteData;
            baseURL = this.parentRouterData.baseURL.href;
            const pattern = new URLPattern({ baseURL, pathname: path });
            baseURL = resolveBaseURLFromPattern(
                pattern.pathname,
                resolvedPathname!
            )!.href;
        }

        return new URLPattern({ baseURL, pathname: basePathname });
    }

    protected abstract shouldIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract intercept(navigateEvent: NavigateEvent): void;

    private setRef = (ref: HTMLElement | null) => {
        this.ref = ref;
    }

    render() {
        if (!this.navigation) return;
        return (
            <div id={this.id} className="react-motion-router" style={{ width: '100%', height: '100%' }} ref={this.setRef}>
                <RouteDataContext.Consumer>
                    {(parentRouteData) => {
                        this.parentRouteData = parentRouteData;
                        if (!this.isRoot && !parentRouteData) return <></>;

                        const {
                            children,
                            nextScreen,
                            currentScreen
                        } = StateFromChildren(this.children, this.props, this.state, this.baseURL.href);
                        this._currentScreen = currentScreen ?? null;
                        this._nextScreen = nextScreen ?? null;
                        this.children = children;

                        return (
                            <RouterDataContext.Provider value={this.routerData}>
                                <AnimationLayer
                                    ref={this.animationLayer}
                                    navigation={this.navigation}
                                    currentScreen={currentScreen ?? null}
                                    nextScreen={nextScreen ?? null}
                                    backNavigating={this.state.backNavigating}
                                    disableBrowserRouting={Boolean(this.props.config.disableBrowserRouting)}
                                >
                                    {children}
                                </AnimationLayer>
                            </RouterDataContext.Provider>
                        );
                    }}
                </RouteDataContext.Consumer>
            </div>
        );
    }
}