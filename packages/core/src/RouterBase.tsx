import { NavigationBase, NavigateEvent, BackEvent } from './NavigationBase';
import { AnimationLayer } from './AnimationLayer';
import {
    AnimationConfig,
    SwipeDirection,
    ScreenChild,
    PlainObject,
    RouterEventMap
} from './common/types';
import { RouterData, RoutesData, RouterDataContext } from './RouterData';
import { PageAnimationEndEvent } from './common/events';
import { concatenateURL, dispatchEvent, includesRoute, matchRoute, searchParamsToObject } from './common/utils';
import { Component } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';

interface Config {
    animation?: AnimationConfig;
    defaultRoute?: string;
    swipeAreaWidth?: number;
    minFlingVelocity?: number;
    hysteresis?: number;
    basePathname?: string;
    disableDiscovery?: boolean;
    swipeDirection?: SwipeDirection;
    disableBrowserRouting?: boolean;
    paramsSerializer?(params: PlainObject): string;
    paramsDeserializer?(queryString: string): PlainObject;
}

export interface RouterBaseProps {
    id?: string;
    config: Config;
    children: ScreenChild | ScreenChild[];
}

export interface RouterBaseState {
    currentPath: string | undefined;
    nextPath: string | undefined;
    backNavigating: boolean;
    gestureNavigating: boolean;
    routesData: RoutesData;
    implicitBack: boolean;
    children: ScreenChild | ScreenChild[];
    paths: (string | undefined)[];
    defaultDocumentTitle: string;
    documentTitle: string;
}

function StateFromChildren(
    props: RouterBaseProps,
    state: RouterBaseState,
) {
    let { paths, currentPath, nextPath } = state;
    let nextMatched = false;
    let currentMatched = false;
    let swipeDirection: SwipeDirection | undefined;
    let swipeAreaWidth: number | undefined;
    let minFlingVelocity: number | undefined;
    let hysteresis: number | undefined;
    let disableDiscovery: boolean | undefined;
    let documentTitle: string | null = null;

    if (state.paths.length) {
        if (!includesRoute(nextPath, paths) && state.paths.includes(undefined)) {
            nextPath = undefined;
        }
        if (currentPath !== null && !includesRoute(currentPath, paths) && state.paths.includes(undefined)) {
            currentPath = undefined;
        }
    }

    const children: ScreenChild[] = [];
    let keptAliveKey: React.Key | undefined = undefined;
    // get current child
    Children.forEach(
        state.children, // match current child from state
        (child) => {
            if (currentPath === null) return;
            if (!isValidElement(child)) return;
            if (matchRoute(child.props.resolvedPathname, nextPath)) {
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
            if (props.children === state.children) {
                // first load so resolve by path instead of resolvedPathname
                if (child.props.config?.keepAlive) {
                    // only match screens with keep alive.
                    matchInfo = matchRoute(child.props.path, currentPath);
                }
            } else {
                matchInfo = matchRoute(child.props.resolvedPathname, currentPath);
            }
            if (matchInfo) {
                let mountProps = { out: true, in: false };
                if (state.gestureNavigating) mountProps = { in: true, out: false };
                currentMatched = true;
                children.push(
                    cloneElement(child, {
                        ...mountProps,
                        resolvedPathname: matchInfo.matchedPathname,
                        key: child.key ?? Math.random()
                    }) as ScreenChild
                );
            }
        }
    )

    // get next child
    Children.forEach(
        props.children,
        (child) => {
            if (!isValidElement(child)) return;
            if (!state.paths.includes(child.props.path)) paths.push(child.props.path);
            if (nextMatched) return;
            const matchInfo = matchRoute(child.props.path, nextPath);
            if (matchInfo) {
                nextMatched = true;
                const { config } = child.props;
                swipeDirection = config?.swipeDirection;
                swipeAreaWidth = config?.swipeAreaWidth;
                hysteresis = config?.hysteresis;
                disableDiscovery = config?.disableDiscovery;
                minFlingVelocity = config?.minFlingVelocity;
                documentTitle = child.props.name || null;
                let mountProps = { in: true, out: false };
                if (state.gestureNavigating) mountProps = { out: true, in: false };
                const key = keptAliveKey || Math.random();
                children.push(
                    cloneElement(child, {
                        ...mountProps,
                        resolvedPathname: matchInfo.matchedPathname,
                        key
                    }) as ScreenChild
                );
            }
        }
    );

    // not found case
    if (!children.some((child) => child.props.in)) {
        const children = Children.map(props.children, (child: ScreenChild) => {
            if (!isValidElement(child)) return undefined;
            if (matchRoute(child.props.path, undefined)) {
                const { config } = child.props;
                swipeDirection = config?.swipeDirection;
                swipeAreaWidth = config?.swipeAreaWidth;
                hysteresis = config?.hysteresis;
                disableDiscovery = config?.disableDiscovery;
                minFlingVelocity = config?.minFlingVelocity;
                documentTitle = child.props.name ?? null;
                return cloneElement(
                    child, {
                    in: true,
                    out: false,
                }
                ) as ScreenChild;
            }
        });

        return {
            children,
            documentTitle,
            swipeDirection: swipeDirection || props.config.swipeDirection,
            swipeAreaWidth: swipeAreaWidth || props.config.swipeAreaWidth,
            hysteresis: hysteresis || props.config.hysteresis,
            disableDiscovery: disableDiscovery === undefined ? props.config.disableDiscovery : disableDiscovery,
            minFlingVelocity: minFlingVelocity || props.config.minFlingVelocity
        };
    }

    return {
        paths,
        children,
        documentTitle,
        swipeDirection: swipeDirection || props.config.swipeDirection,
        swipeAreaWidth: swipeAreaWidth || props.config.swipeAreaWidth,
        hysteresis: hysteresis || props.config.hysteresis,
        disableDiscovery: disableDiscovery === undefined ? props.config.disableDiscovery : disableDiscovery,
        minFlingVelocity: minFlingVelocity || props.config.minFlingVelocity
    }
}

export abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState> extends Component<P, S> {
    protected ref: HTMLElement | null = null;
    protected abstract _routerData: RouterData;
    protected config: Config;

    static defaultProps = {
        config: {
            animation: DEFAULT_ANIMATION
        }
    }

    constructor(props: RouterBaseProps) {
        super(props as P);
        if (props.config) {
            this.config = props.config;
        } else {
            this.config = {
                animation: DEFAULT_ANIMATION
            }
        }
    }

    state: S = {
        currentPath: undefined,
        backNavigating: false,
        gestureNavigating: false,
        routesData: new Map(),
        implicitBack: false,
        defaultDocumentTitle: document.title,
        documentTitle: document.title,
        paths: new Array<string>(),
    } as S;

    static getDerivedStateFromProps(props: RouterBaseProps, state: RouterBaseState) {
        return StateFromChildren(props, state);
    }

    componentDidMount() {
        this._routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this._routerData.paramsSerializer = this.props.config.paramsSerializer;
        this.onPopStateListener = this.onPopStateListener.bind(this);
        window.addEventListener('popstate', this.onPopStateListener);
    }

    componentDidUpdate(_: Readonly<P>, prevState: Readonly<S>): void {
        if (prevState.documentTitle !== this.state.documentTitle) {
            this.onDocumentTitleChange(this.state.documentTitle);
        }
    }

    componentWillUnmount() {
        if (this.ref) this.removeNavigationEventListeners(this.ref);
        window.removeEventListener('popstate', this.onPopStateListener);
    }

    /**
     * Initialises current path and routes data from URL search params.
     */
    protected initialise(navigation: NavigationBase) {
        // get url search params and append to existing route params
        let currentPath = navigation.baseURL.pathname;
        const paramsDeserializer = this._routerData.paramsDeserializer || null;
        const searchParams = searchParamsToObject(window.location.search, paramsDeserializer);
        const routesData = this.state.routesData;
        this._routerData.routesData = routesData;

        if (searchParams) {
            const routeData = routesData.get(currentPath);
            routesData.set(currentPath, {
                focused: routeData?.focused ?? false,
                preloaded: routeData?.preloaded ?? false,
                setParams: routeData?.setParams ?? (() => { }),
                params: searchParams,
                config: routeData?.config ?? {},
                setConfig: routeData?.setConfig ?? (() => { })
            });
        }
        this.setState({ currentPath, routesData });
        this._routerData.currentPath = currentPath;

        this._routerData.dispatchEvent = this.dispatchEvent;
        this._routerData.addEventListener = this.addEventListener;
        this._routerData.removeEventListener = this.removeEventListener;
    }

    protected dispatchEvent = (event: Event) => {
        const ref = this.ref ?? undefined;
        return dispatchEvent(event, ref);
    }

    protected addEventListener = <K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => {
        return this.ref?.addEventListener(type, listener, options);
    }

    protected removeEventListener = <K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined) => {
        return this.ref?.removeEventListener(type, listener, options);
    }

    get id() {
        return Array.from(this.baseURL.pathname).map(char =>
            char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join('');
    }

    protected get parentRouterData() {
        return this._routerData.parentRouterData;
    }

    protected get baseURL() {
        const origin = window.location.origin;
        const basePathname = this.props.config.basePathname || "";
        if (this.parentRouterData) {
            const parentBaseURL = this.parentRouterData.navigation.baseURL;
            const parentCurrentPath = this.parentRouterData.currentScreen?.resolvedPathname || "";
            return concatenateURL(basePathname, concatenateURL(parentCurrentPath, parentBaseURL));
        } else {
            return new URL(basePathname, origin);
        }
    }

    protected abstract get navigation(): NavigationBase;

    abstract onAnimationEnd: (e: PageAnimationEndEvent) => void;

    abstract onGestureNavigationStart: () => void;
    abstract onGestureNavigationEnd: () => void;

    protected onPopStateListener(e: Event) {
        let currentPath = this.navigation.baseURL.pathname;
        const paramsDeserializer = this._routerData.paramsDeserializer || null;
        const searchParams = searchParamsToObject(window.location.search, paramsDeserializer);
        const routesData = this.state.routesData;
        this._routerData.routesData = this.state.routesData;

        if (searchParams) {
            const routeData = this.state.routesData.get(currentPath);
            routesData.set(currentPath, {
                focused: routeData?.focused ?? false,
                preloaded: routeData?.preloaded ?? false,
                setParams: routeData?.setParams ?? (() => { }),
                params: searchParams,
                config: routeData?.config ?? {},
                setConfig: routeData?.setConfig ?? (() => { })
            });
        }
        this.setState({ routesData });
    };

    abstract onBackListener: (e: BackEvent) => void;

    abstract onNavigateListener: (e: NavigateEvent) => void;

    protected onDocumentTitleChange = (title: string | null) => {
        if (title) document.title = title;
        else document.title = this.state.defaultDocumentTitle;
    }

    addNavigationEventListeners(ref: HTMLElement) {
        ref.addEventListener('go-back', this.onBackListener, { capture: true });
        ref.addEventListener('navigate', this.onNavigateListener, { capture: true });
    }

    removeNavigationEventListeners(ref: HTMLElement) {
        ref.removeEventListener('go-back', this.onBackListener);
        ref.removeEventListener('navigate', this.onNavigateListener);
    }

    private setRef = (ref: HTMLElement | null) => {
        if (this.ref)
            this.removeNavigationEventListeners(this.ref);

        this.ref = ref;

        if (ref)
            this.addNavigationEventListeners(ref);
    }

    render() {
        return (
            <div id={this.id} className="react-motion-router" style={{ width: '100%', height: '100%' }} ref={this.setRef}>
                <RouterDataContext.Consumer>
                    {(routerData) => {
                        this._routerData.parentRouterData = routerData;
                        if (!this._routerData.navigation) return;
                        const {
                            hysteresis = DEFAULT_GESTURE_CONFIG.hysteresis,
                            minFlingVelocity = DEFAULT_GESTURE_CONFIG.minFlingVelocity,
                            swipeAreaWidth = DEFAULT_GESTURE_CONFIG.swipeAreaWidth,
                            swipeDirection = DEFAULT_GESTURE_CONFIG.swipeDirection
                        } = this.props.config;
                        return (
                            <RouterDataContext.Provider value={this._routerData}>
                                <AnimationLayer
                                    currentScreen={this._routerData.currentScreen}
                                    nextScreen={this._routerData.nextScreen}
                                    disableBrowserRouting={Boolean(this.props.config.disableBrowserRouting)}
                                    disableDiscovery={Boolean(this.props.config.disableDiscovery)}
                                    hysteresis={hysteresis}
                                    minFlingVelocity={minFlingVelocity}
                                    swipeAreaWidth={swipeAreaWidth}
                                    swipeDirection={swipeDirection}
                                    navigation={this.navigation}
                                    onGestureNavigationStart={this.onGestureNavigationStart}
                                    onGestureNavigationEnd={this.onGestureNavigationEnd}
                                    onDocumentTitleChange={this.onDocumentTitleChange}
                                    dispatchEvent={this.dispatchEvent}
                                >
                                    {this.state.children}
                                </AnimationLayer>
                            </RouterDataContext.Provider>
                        );
                    }}
                </RouterDataContext.Consumer>

            </div>
        );
    }
}