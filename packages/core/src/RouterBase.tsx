import { NavigationBase } from './NavigationBase';
import { AnimationLayer } from './AnimationLayer';
import {
    ScreenChild,
    PlainObject,
    RouterEventMap,
    NavigateEventRouterState,
    RouteData
} from './common/types';
import { NestedRouterDataContext, RouterData, RouterDataContext } from './RouterData';
import { dispatchEvent, includesRoute, matchRoute, resolveBaseURLFromPattern, searchParamsToObject } from './common/utils';
import { Component, RefObject, createRef } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';
import { ScreenBase, ScreenBaseProps } from './ScreenBase';

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
    currentPath: string | undefined;
    nextPath: string | undefined;
    currentScreen?: RefObject<ScreenBase>;
    nextScreen?: RefObject<ScreenBase>;
    backNavigating: boolean;
    children: ScreenChild | ScreenChild[];
    defaultDocumentTitle: string;
    documentTitle: string;
    navigation: N;
}

function StateFromChildren(
    props: RouterBaseProps,
    state: RouterBaseState,
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
    protected readonly routerData: RouterData<N>;
    public readonly parentRouterData: RouterData<NavigationBase> | null = null;
    public readonly parentRouteData: RouteData | null = null;
    protected animationLayer = createRef<AnimationLayer>();
    private static rootRouterRef: WeakRef<RouterBase> | null = null;
    static readonly contextType = NestedRouterDataContext;
    context!: React.ContextType<typeof NestedRouterDataContext>;

    constructor(props: P, context: React.ContextType<typeof NestedRouterDataContext>) {
        super(props);

        this.routerData = new RouterData<N>(this);
        this.parentRouteData = context?.routeData ?? null;
        this.parentRouterData = context?.routerData ?? null;
        if (this.parentRouterData) {
            this.parentRouterData.childRouterData = this.routerData;
        }
        if (this.isRoot) {
            RouterBase.rootRouterRef = new WeakRef(this);
        }
    }

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
        children: this.props.children,
        backNavigating: false,
    } as S;

    static getDerivedStateFromProps(props: RouterBaseProps, state: RouterBaseState) {
        return StateFromChildren(props, state);
    }

    componentDidMount() {
        this.routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this.routerData.paramsSerializer = this.props.config.paramsSerializer;

        if (this.isRoot) {
            window.navigation.addEventListener('navigate', this.handleNavigationDispatch)
        }
    }

    componentWillUnmount() {
        if (this.isRoot) {
            window.navigation.removeEventListener('navigate', this.handleNavigationDispatch);
        }
    }

    private handleNavigationDispatch = (e: NavigateEvent) => {
        let router: RouterBase = this;
        const pathname = new URL(e.destination.url).pathname;
        const baseURLPattern = router.baseURLPattern.pathname;
        // travel down router tree to find the correct router
        while(
            router.routerData.childRouterData
            && router.routerData.childRouterData.routerInstance.mounted
            && includesRoute(
                router.routerData.childRouterData.routerInstance.pathPatterns,
                pathname,
                router.routerData.childRouterData.routerInstance.baseURL.href
            )
        ) {
            router = router.routerData.childRouterData.routerInstance;
        }
        if (router.shouldIntercept(e)) {
            router.intercept(e);
        }
    }

    protected getRouterById(routerId: string, target?: RouterBase): RouterBase | null {
        const router = target ?? RouterBase.rootRouterRef?.deref();
        if (router!.id === routerId) {
            return router ?? null;
        } else if (router?.routerData.childRouterData) {
            return this.getRouterById(routerId, router!.routerData.childRouterData.routerInstance);
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
        let basePathname = this.props.config.basePathname ?? defaultBasePathname;

        if (this.parentRouterData && this.parentRouteData) {
            const { resolvedPathname = window.location.pathname, path } = this.parentRouteData;
            const parentBaseURL = this.parentRouterData.baseURL?.href;
            const pattern = new URLPattern({ baseURL: parentBaseURL, pathname: path });
            baseURL = resolveBaseURLFromPattern(
                pattern.pathname,
                resolvedPathname
            )!.href;
        }

        return new URLPattern({ baseURL, pathname: basePathname });
    }

    get pathPatterns() {
        return Children.map(this.props.children, (child) => {
            return {pattern: child.props.path, caseSensitive: Boolean(child.props.caseSensitive)};
        });
    }

    get mounted() {
        return Boolean(this.ref);
    }

    protected abstract get navigation(): NavigationBase;

    protected abstract shouldIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract intercept(navigateEvent: NavigateEvent): void;

    private setRef = (ref: HTMLElement | null) => {
        this.ref = ref;
    }

    render() {
        if (!this.navigation) return;
        return (
            <div id={this.id} className="react-motion-router" style={{ width: '100%', height: '100%' }} ref={this.setRef}>
                <RouterDataContext.Provider value={this.routerData}>
                    <AnimationLayer
                        ref={this.animationLayer}
                        navigation={this.navigation}
                        currentScreen={this.state.currentScreen ?? null}
                        nextScreen={this.state.nextScreen ?? null}
                        backNavigating={this.state.backNavigating}
                        disableBrowserRouting={Boolean(this.props.config.disableBrowserRouting)}
                    >
                        {this.state.children}
                    </AnimationLayer>
                </RouterDataContext.Provider>
            </div>
        );
    }
}