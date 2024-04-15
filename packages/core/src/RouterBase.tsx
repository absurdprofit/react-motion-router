import { NavigationBase } from './NavigationBase';
import { AnimationLayer } from './AnimationLayer';
import {
    ScreenChild,
    PlainObject,
    RouterEventMap,
    RoutesData
} from './common/types';
import { NestedRouterContext, RouterContext } from './RouterContext';
import { dispatchEvent, includesRoute, matchRoute, resolveBaseURLFromPattern, searchParamsToObject } from './common/utils';
import { Component, RefObject, createRef } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';
import { ScreenBase, ScreenBaseProps } from './ScreenBase';
import { ScrollRestorationData } from './ScrollRestorationData';

export interface RouterBaseProps<S extends ScreenBase = ScreenBase> {
    id?: string;
    config: {
        screenConfig?: S["props"]["config"];
        basePathname?: string;
    };
    children: ScreenChild<S["props"], S> | ScreenChild<S["props"], S>[];
}

export interface RouterBaseState<S extends ScreenBase = ScreenBase, N extends NavigationBase = NavigationBase> {
    currentPath: string | undefined;
    nextPath: string | undefined;
    previousScreen?: RefObject<S>;
    currentScreen?: RefObject<S>;
    nextScreen?: RefObject<S>;
    children: ScreenChild<S["props"], S> | ScreenChild<S["props"], S>[];
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
    public readonly routesData: RoutesData = new Map();
    public readonly scrollRestorationData = new ScrollRestorationData();
    public readonly parentRouter: RouterBase | null = null;
    public readonly parentScreen: ScreenBase | null = null;
    private _childRouter: WeakRef<RouterBase> | null = null;
    protected animationLayer = createRef<AnimationLayer>();
    private static rootRouterRef: WeakRef<RouterBase> | null = null;
    static readonly contextType = NestedRouterContext;
    context!: React.ContextType<typeof NestedRouterContext>;

    constructor(props: P, context: React.ContextType<typeof NestedRouterContext>) {
        super(props);

        this.parentScreen = context?.parentScreen ?? null;
        this.parentRouter = context?.parentRouter ?? null;
        if (this.parentRouter) {
            this.parentRouter.childRouter = this;
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
    } as S;

    static getDerivedStateFromProps(props: RouterBaseProps, state: RouterBaseState) {
        return StateFromChildren(props, state);
    }

    componentDidMount() {
        if (this.isRoot) {
            window.navigation.addEventListener('navigate', this.handleNavigationDispatch);
        }
    }

    componentWillUnmount() {
        if (this.isRoot) {
            window.navigation.removeEventListener('navigate', this.handleNavigationDispatch);
        }
    }

    private handleNavigationDispatch = (e: NavigateEvent) => {
        let router: RouterBase = this;
        // travel down router tree to find the correct router
        while (router.childRouter?.canIntercept(e)) {
            router = router.childRouter;
        }
        router.intercept(e);
    }

    getRouterById(routerId: string, target?: RouterBase): RouterBase | null {
        const router = target ?? RouterBase.rootRouterRef?.deref();
        if (router!.id === routerId) {
            return router ?? null;
        } else if (router?.childRouter) {
            return this.getRouterById(routerId, router!.childRouter);
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

    public preloadRoute(pathname: string) {
        return new Promise<boolean>((resolve, reject) => {
            let found = false;
            const routes = this.props.children;
            Children.forEach<ScreenChild<ScreenBaseProps>>(routes, (route) => {
                if (found) return; // stop after first
                if (!isValidElement(route)) return;
                const { path, caseSensitive } = route.props;
                const baseURLPattern = this.baseURLPattern.pathname;
                const matchInfo = matchRoute(path, pathname, baseURLPattern, caseSensitive);
                if (!matchInfo) return;
                found = true;
                const config = {
                    ...this.routesData.get(path)?.config,
                    ...route.props.config
                };
                queueMicrotask(async () => {
                    const preloadTasks = [];
                    if ('load' in route.props.component) {
                        preloadTasks.push(route.props.component.load());
                    }
                    if (config?.header?.component && 'load' in config?.header?.component) {
                        preloadTasks.push(config?.header?.component.load());
                    }
                    if (config?.footer?.component && 'load' in config?.footer?.component) {
                        preloadTasks.push(config?.footer?.component.load());
                    }
                    try {
                        await Promise.all(preloadTasks);
                        resolve(found);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            if (!found)
                resolve(false);
        });
    }

    get id() {
        if (this.props.id) return this.props.id;
        return this.baseURL.pathname
            .toLowerCase()
            .replace('/', 'root')
            .replace(/[^\w-]/g, '-') // Remove non-alphanumeric chars
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
    }

    get currentScreen() {
        return this.state.currentScreen?.current;
    }

    get nextScreen() {
        return this.state.nextScreen?.current;
    }

    get isRoot() {
        return !this.parentRouter;
    }

    get baseURL() {
        const pathname = this.isRoot ? window.location.pathname : this.parentScreen?.resolvedPathname!;
        const pattern = this.baseURLPattern.pathname;

        return resolveBaseURLFromPattern(pattern, pathname)!;
    }

    get baseURLPattern() {
        let baseURL = window.location.origin + "/";
        const defaultBasePathname = this.isRoot ? new URL(".", document.baseURI).href.replace(baseURL, '') : ".";
        let basePathname = this.props.config.basePathname ?? defaultBasePathname;

        if (this.parentRouter && this.parentScreen) {
            const { resolvedPathname = window.location.pathname, path } = this.parentScreen;
            const parentBaseURL = this.parentRouter.baseURL?.href;
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
            return { pattern: child.props.path, caseSensitive: Boolean(child.props.caseSensitive) };
        });
    }

    get mounted() {
        return Boolean(this.ref);
    }

    get navigation() {
        return this.state.navigation;
    }

    get childRouter() {
        return this._childRouter?.deref() ?? null;
    }

    set childRouter(childRouter: RouterBase | null) {
        const currentChildRouter = this._childRouter?.deref();
        if (
            currentChildRouter
            && childRouter?.id !== currentChildRouter?.id
            && currentChildRouter?.mounted
        ) {
            throw new Error("It looks like you have two navigators at the same level. Try simplifying your navigation structure by using a nested router instead.");
        }
        if (childRouter)
            this._childRouter = new WeakRef(childRouter);
        else
            this._childRouter = null;
    }

    protected abstract canIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract shouldIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract intercept(navigateEvent: NavigateEvent): void;

    private setRef = (ref: HTMLElement | null) => {
        this.ref = ref;
    }

    render() {
        if (!this.navigation) return;
        return (
            <div id={this.id} className="react-motion-router" style={{ width: '100%', height: '100%' }} ref={this.setRef}>
                <RouterContext.Provider value={this}>
                    <AnimationLayer
                        ref={this.animationLayer}
                        navigation={this.navigation}
                        currentScreen={this.state.currentScreen ?? null}
                        nextScreen={this.state.nextScreen ?? null}
                    >
                        {this.state.children}
                    </AnimationLayer>
                </RouterContext.Provider>
            </div>
        );
    }
}