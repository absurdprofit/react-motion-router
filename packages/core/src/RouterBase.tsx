import { NavigationBase, NavigateEvent, BackEvent } from './NavigationBase';
import { AnimationLayer } from './AnimationLayer';
import {
    ScreenChild,
    PlainObject,
    RouterEventMap
} from './common/types';
import { RouterData, RouterDataContext } from './RouterData';
import { PageAnimationEndEvent } from './common/events';
import { concatenateURL, dispatchEvent, includesRoute, matchRoute, searchParamsToObject } from './common/utils';
import { Component } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';
import { ScreenBaseProps } from './ScreenBase';

export interface RouterBaseProps {
    id?: string;
    config: {
        screenConfig: ScreenBaseProps["config"];
        defaultRoute?: string;
        basePathname?: string;
        disableBrowserRouting?: boolean;
        paramsSerializer?(params: PlainObject): string;
        paramsDeserializer?(queryString: string): PlainObject;
    };
    children: ScreenChild | ScreenChild[];
}

export interface RouterBaseState {
    currentPath: string | undefined;
    nextPath: string | undefined;
    backNavigating: boolean;
    gestureNavigating: boolean;
    implicitBack: boolean;
    children: ScreenChild | ScreenChild[];
    paths: (string | undefined)[];
    defaultDocumentTitle: string;
    documentTitle: string;
    baseURL: URL;
}

function StateFromChildren(
    props: RouterBaseProps,
    state: RouterBaseState,
) {
    let { paths, currentPath, nextPath } = state;
    const baseURL = state.baseURL.toString();
    const isFirstLoad = props.children === state.children;
    let nextMatched = false;
    let currentMatched = false;
    let documentTitle: string = state.defaultDocumentTitle;

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
            if (matchRoute(child.props.resolvedPathname, nextPath, baseURL)) {
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
                matchInfo = matchRoute(child.props.path?.replace(/^\//, ''), currentPath, baseURL);
            } else {
                matchInfo = matchRoute(child.props.resolvedPathname, currentPath, baseURL);
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
                        resolvedPathname: matchInfo.matchedPathname,
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
                if (!state.paths.includes(child.props.path)) paths.push(child.props.path);
                if (nextMatched) return;
                const matchInfo = matchRoute(child.props.path, nextPath, baseURL);
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
                            resolvedPathname: matchInfo.matchedPathname,
                            key
                        }) as ScreenChild
                    );
                }
            }
        );
    }

    // not found case
    if (!children.some((child) => child.props.in)) {
        const children = Children.map(props.children, (child: ScreenChild) => {
            if (!isValidElement(child)) return undefined;
            if (matchRoute(child.props.path, undefined, baseURL)) {
                documentTitle = child.props.name ?? state.defaultDocumentTitle;
                return cloneElement(child, {
                    in: true,
                    out: false,
                    config: {
                        ...props.config.screenConfig,
                        ...child.props.config
                    }
                }) as ScreenChild;
            }
        });

        return {
            paths,
            children,
            documentTitle,
        };
    }

    return {
        paths,
        children,
        documentTitle,
    }
}

export abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState> extends Component<P, S> {
    protected ref: HTMLElement | null = null;
    protected _routerData: RouterData = new RouterData(this);
    static contextType = RouterDataContext;
    context!: React.ContextType<typeof RouterDataContext>;

    constructor(props: P, context: React.ContextType<typeof RouterDataContext>) {
        super(props);

        this._routerData.dispatchEvent = this.dispatchEvent;
        this._routerData.addEventListener = this.addEventListener;
        this._routerData.removeEventListener = this.removeEventListener;
        this._routerData.parentRouterData = context;

        this.state.baseURL = this.baseURL;

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

    static defaultProps = {
        config: {
            screenConfig: {
                animation: DEFAULT_ANIMATION,
                ...DEFAULT_GESTURE_CONFIG
            }
        }
    };

    state: S = {
        currentPath: undefined,
        backNavigating: false,
        gestureNavigating: false,
        implicitBack: false,
        defaultDocumentTitle: document.title,
        documentTitle: document.title,
        paths: new Array<string>(),
        children: this.props.children
    } as S;

    static getDerivedStateFromProps(props: RouterBaseProps, state: RouterBaseState) {
        return StateFromChildren(props, state);
    }

    componentDidMount() {
        this._routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this._routerData.paramsSerializer = this.props.config.paramsSerializer;
    }

    componentDidUpdate(_: Readonly<P>, prevState: Readonly<S>): void {
        if (prevState.documentTitle !== this.state.documentTitle) {
            this.onDocumentTitleChange(this.state.documentTitle);
        }
    }

    componentWillUnmount() {
        if (this.ref) this.removeNavigationEventListeners(this.ref);
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
        let basePathname = this.props.config.basePathname || "/";
        // baseURL must end with / for proper concatenation in URL and URLPattern APIs
        if (!basePathname.endsWith("/"))
            basePathname += "/";
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