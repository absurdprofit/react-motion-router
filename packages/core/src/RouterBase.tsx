import { NavigationBase } from './NavigationBase';
import { ScreenTransitionLayer } from './ScreenTransitionLayer';
import {
    ScreenChild,
    PlainObject,
    RouterBaseEventMap,
    RoutesData,
    HTMLRouterBaseElement
} from './common/types';
import { NestedRouterContext, RouterContext } from './RouterContext';
import { dispatchEvent, includesRoute, matchRoute, resolveBaseURLFromPattern, searchParamsToObject } from './common/utils';
import { Component, RefObject, createRef } from 'react';
import { DEFAULT_ANIMATION, DEFAULT_GESTURE_CONFIG } from './common/constants';
import { isValidElement, Children, cloneElement } from 'react';
import { ScreenBase, ScreenBaseProps } from './ScreenBase';
import { ScrollRestorationData } from './ScrollRestorationData';
import { SharedElementLayer } from './SharedElementLayer';

export interface RouterBaseProps<S extends ScreenBase = ScreenBase> {
    id?: string;
    config: {
        screenConfig?: S["props"]["config"];
        basePathname?: string;
    };
    children: ScreenChild<S["props"], S> | ScreenChild<S["props"], S>[];
}

export interface RouterBaseState<N extends NavigationBase = NavigationBase> {
    defaultDocumentTitle: string;
    documentTitle: string;
    navigation: N;
}

export abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState, E extends RouterBaseEventMap = RouterBaseEventMap> extends Component<P, S> {
    protected ref: HTMLRouterBaseElement | null = null;
    public readonly routesData: RoutesData = new Map();
    public readonly scrollRestorationData = new ScrollRestorationData();
    public readonly parentRouter: RouterBase | null = null;
    public readonly parentScreen: ScreenBase | null = null;
    private _childRouter: WeakRef<RouterBase> | null = null;
    protected screenTransitionLayer = createRef<ScreenTransitionLayer>();
    protected sharedElementLayer = createRef<SharedElementLayer>();
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
    } as S;

    async componentDidMount() {
        if (this.isRoot) {
            window.navigation.addEventListener('navigate', this.handleNavigationDispatch);
        }
        if (window.navigation.transition?.navigationType !== "reload") {
            // Trigger reload on first load.
            // Gives routers ability to initialise state with the benefits of interception.
            await window.navigation.transition?.finished;
            window.navigation.reload({ info: { firstLoad: true } });
        }

    }

    componentWillUnmount() {
        if (this.isRoot) {
            window.navigation.removeEventListener('navigate', this.handleNavigationDispatch);
        }
    }

    private handleNavigationDispatch = (e: NavigateEvent) => {
        if (!this.canIntercept(e)) return;
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

    public addEventListener<K extends keyof E>(type: K, listener: (this: HTMLElement, ev: E[K]) => any, options?: boolean | AddEventListenerOptions | undefined) {
        // @ts-ignore
        return this.ref?.addEventListener(type, listener, options);
    }

    public removeEventListener<K extends keyof E>(type: K, listener: (this: HTMLElement, ev: E[K]) => any, options?: boolean | EventListenerOptions | undefined) {
        // @ts-ignore
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

    get id(): string {
        if (this.props.id) return this.props.id;
        const prefix = this.parentRouter ? `${this.parentRouter.id}-` : '';
        const id = (this.parentScreen?.path ?? 'root')
            .toLowerCase()
            .replace(/[^\w-]/g, '-') // Remove non-alphanumeric chars
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
        return `${prefix}${id}`;
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

    get navigation(): S["navigation"] {
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
    protected abstract get screens(): P["children"];

    private setRef = (ref: HTMLElement | null) => {
        this.ref = ref;
    }

    render() {
        if (!this.navigation) return;
        return (
            <div id={this.id} className="react-motion-router" style={{ width: '100%', height: '100%' }} ref={this.setRef}>
                <RouterContext.Provider value={this}>
                    <SharedElementLayer
                        ref={this.sharedElementLayer}
                        navigation={this.navigation}
                    />
                    <ScreenTransitionLayer
                        ref={this.screenTransitionLayer}
                        navigation={this.navigation}
                    >
                        {this.screens}
                    </ScreenTransitionLayer>
                </RouterContext.Provider>
            </div>
        );
    }
}