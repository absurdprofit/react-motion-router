import { NavigationBase, BackEvent } from './NavigationBase';
import { AnimationLayer } from './AnimationLayer';
import {
    ScreenChild,
    PlainObject,
    RouterEventMap,
    NavigateEventRouterState
} from './common/types';
import { RouterData, RouterDataContext } from './RouterData';
import { PageAnimationEndEvent } from './common/events';
import { dispatchEvent, matchRoute, searchParamsToObject } from './common/utils';
import { Component } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';
import { ScreenBaseProps } from './ScreenBase';

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

export interface RouterBaseState {
    currentPath: string;
    nextPath: string | undefined;
    backNavigating: boolean;
    children: ScreenChild | ScreenChild[];
    paths: (string | undefined)[];
    defaultDocumentTitle: string;
    documentTitle: string;
    navigation: NavigationBase;
}

function StateFromChildren(
    props: RouterBaseProps,
    state: RouterBaseState,
) {
    let { paths, currentPath, nextPath } = state;
    const baseURL = state.navigation.baseURL.toString();
    const isFirstLoad = props.children === state.children;
    let nextMatched = false;
    let currentMatched = false;
    let documentTitle: string = state.defaultDocumentTitle;

    const children: ScreenChild[] = [];
    let keptAliveKey: React.Key | undefined = undefined;
    // get current child
    Children.forEach(
        state.children, // match current child from state
        (child) => {
            if (!isValidElement(child)) return;
            if (
                typeof nextPath === "string"
                && typeof child.props.resolvedPathname === "string"
                && matchRoute(child.props.resolvedPathname, nextPath, undefined, child.props.caseSensitive)) {
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
                if (!state.paths.includes(child.props.path)) paths.push(child.props.path);
            } else if (typeof child.props.resolvedPathname === "string") {
                matchInfo = matchRoute(child.props.resolvedPathname, currentPath, undefined, child.props.caseSensitive);
            } else {
                return;
            }
            if (matchInfo) {
                currentMatched = true;
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
                        key: child.key ?? Math.random()
                    }) as ScreenChild
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
                    documentTitle = child.props.name || state.defaultDocumentTitle;
                    const key = keptAliveKey || Math.random();
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
                            key
                        }) as ScreenChild
                    );
                }
            }
        );
    }

    return {
        paths,
        children,
        documentTitle,
    }
}

export abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState, N extends NavigationBase = NavigationBase> extends Component<P, S> {
    protected ref: HTMLElement | null = null;
    private _routerData = new RouterData<N>(this);
    private static rootRouterRef: WeakRef<RouterBase> | null = null;
    static readonly contextType = RouterDataContext;
    context!: React.ContextType<typeof RouterDataContext>;

    constructor(props: P, context: React.ContextType<typeof RouterDataContext>) {
        super(props);

        this._routerData.dispatchEvent = this.dispatchEvent;
        this._routerData.addEventListener = this.addEventListener;
        this._routerData.removeEventListener = this.removeEventListener;
        this._routerData.parentRouterData = context;
        if (this.isRoot) {
            RouterBase.rootRouterRef = new WeakRef(this);
        }

        // get url search params and append to existing route params
        const { currentPath } = this.state;
        const paramsDeserializer = this._routerData.paramsDeserializer || null;
        const searchParams = searchParamsToObject(window.location.search, paramsDeserializer);
        const routesData = this._routerData.routesData;

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
        paths: new Array<string>(),
        children: this.props.children,
        backNavigating: false,
    } as S;

    static getDerivedStateFromProps(props: RouterBaseProps, state: RouterBaseState) {
        return StateFromChildren(props, state);
    }

    componentDidMount() {
        this._routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this._routerData.paramsSerializer = this.props.config.paramsSerializer;

        if (this.isRoot) {
            window.navigation.addEventListener('navigate', this.handleNavigationDispatch)
        }
    }

    componentDidUpdate(_: Readonly<P>, prevState: Readonly<S>): void {
        if (prevState.documentTitle !== this.state.documentTitle) {
            this.onDocumentTitleChange(this.state.documentTitle);
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
        if (router!.id === routerId) {
            return router;
        } else if (router?.routerData.childRouterData) {
            this.getRouterById(routerId, router!.routerData.childRouterData.routerInstance);
        } else {
            return null;
        }
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
        return this.baseURL.pathname
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric chars with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
    }

    protected get routerData() {
        return this._routerData;
    }

    protected get parentRouterData() {
        return this._routerData.parentRouterData;
    }

    protected get isRoot() {
        return !this.parentRouterData;
    }

    protected get baseURL() {
        let baseURL = window.location.origin + "/";
        const defaultBasePathname = this.isRoot ? new URL(".", document.baseURI).href.replace(baseURL, '') : "/";
        let basePathname = this.props.config.basePathname || defaultBasePathname;

        const parentCurrentPath = this.parentRouterData?.currentScreen?.props.path;
        if (parentCurrentPath) {
            baseURL = this.parentRouterData.navigation.baseURL + parentCurrentPath;
        }

        return new URL(baseURL + basePathname);
    }

    protected abstract get navigation(): NavigationBase;

    protected abstract shouldIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract intercept(navigateEvent: NavigateEvent): void;

    abstract onAnimationEnd: (e: PageAnimationEndEvent) => void;

    abstract onGestureNavigationStart: () => void;
    abstract onGestureNavigationEnd: () => void;

    abstract onBackListener: (e: BackEvent) => void;

    protected onDocumentTitleChange = (title: string | null) => {
        if (title) document.title = title;
        else document.title = this.state.defaultDocumentTitle;
    }

    private setRef = (ref: HTMLElement | null) => {
        this.ref = ref;
    }

    render() {
        if (!this._routerData.navigation) return;
        return (
            <div id={this.id} className="react-motion-router" style={{ width: '100%', height: '100%' }} ref={this.setRef}>
                <RouterDataContext.Provider value={this._routerData}>
                    <AnimationLayer
                        currentScreen={this._routerData.currentScreen}
                        nextScreen={this._routerData.nextScreen}
                        disableBrowserRouting={Boolean(this.props.config.disableBrowserRouting)}
                        navigation={this.navigation}
                        onGestureNavigationStart={this.onGestureNavigationStart}
                        onGestureNavigationEnd={this.onGestureNavigationEnd}
                        onDocumentTitleChange={this.onDocumentTitleChange}
                        dispatchEvent={this.dispatchEvent}
                    >
                        {this.state.children}
                    </AnimationLayer>
                </RouterDataContext.Provider>
            </div>
        );
    }
}