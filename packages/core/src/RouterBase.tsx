import { NavigationBase } from './NavigationBase';
import { ScreenTransitionLayer } from './ScreenTransitionLayer';
import {
    ScreenChild,
    RouterBaseEventMap,
    RouterHTMLElement,
} from './common/types';
import { NestedRouterContext, RouterContext } from './RouterContext';
import { dispatchEvent, matchRoute, resolveBaseURLFromPattern } from './common/utils';
import { Component, createRef, isValidElement, Children } from 'react';
import { ScreenBase, ScreenBaseConfig } from './ScreenBase';
import { LoadEvent } from './common/events';

export interface RouterBaseConfig {
    screenConfig?: ScreenBaseConfig;
    basePath?: string;
}

export interface RouterBaseProps<S extends ScreenBase = ScreenBase> {
    id?: string;
    config?: RouterBaseConfig;
    children: ScreenChild<S> | ScreenChild<S>[];
}

export interface RouterBaseState {}

export abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState, E extends RouterBaseEventMap = RouterBaseEventMap> extends Component<P, S> {
    protected readonly ref = createRef<RouterHTMLElement<E>>();
    protected screenTransitionLayer = createRef<ScreenTransitionLayer>();
    public abstract readonly navigation: NavigationBase;
    public readonly parent: RouterBase | null = null;
    #child: WeakRef<RouterBase> | null = null;
    private loadDispatched = false;
    private hasUAVisualTransition = false;
    public readonly parentScreen: ScreenBase | null = null;
    private static rootRouterRef: WeakRef<RouterBase> | null = null;
    static readonly contextType = NestedRouterContext;
    declare context: React.ContextType<typeof NestedRouterContext>;

    constructor(props: P, context: React.ContextType<typeof NestedRouterContext>) {
        super(props);

        this.parentScreen = context?.parentScreen ?? null;
        this.parent = context?.parentRouter ?? null;
        if (this.parent) {
            this.parent.child = this;
        }
        if (this.isRoot) {
            RouterBase.rootRouterRef = new WeakRef(this);
        }
    }

    componentDidMount() {
        if (this.isRoot) {
            window.navigation.addEventListener('navigate', this.handleNavigationDispatch);
        }

        if (!this.loadDispatched) {
            window.navigation.dispatchEvent(new LoadEvent());
            this.loadDispatched = true;
        }
    }

    componentWillUnmount() {
        if (this.isRoot) {
            window.navigation.removeEventListener('navigate', this.handleNavigationDispatch);
        }
    }

    private handleNavigationDispatch = (e: NavigateEvent) => {
        const activeRouters = [...this.#activeRoutersIter()];
        // travel down router tree to find a router that can intercept
        const interceptor = activeRouters.findLast(router => router.canIntercept(e));
        if (interceptor) {
            interceptor.intercept(e);
            this.hasUAVisualTransition = e.hasUAVisualTransition;
        }
    }

    *#activeRoutersIter() {
        let router: RouterBase | null = this;
        while (router) {
            yield router;
            router = router.child;
        }
    }

    getRouterById(routerId: string, target?: RouterBase): RouterBase | null {
        const router = target ?? RouterBase.rootRouterRef?.deref();
        if (router!.id === routerId) {
            return router ?? null;
        } else if (router?.child) {
            return this.getRouterById(routerId, router!.child);
        } else {
            return null;
        }
    }

    dispatchEvent(event: Event) {
        const ref = this.ref.current ?? undefined;
        return dispatchEvent(event, ref);
    }

    addEventListener<K extends keyof E>(type: K, listener: (this: RouterHTMLElement<E>, ev: E[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        return this.ref.current?.addEventListener(type, listener, options);
    }

    removeEventListener<K extends keyof E>(type: K, listener: (this: RouterHTMLElement<E>, ev: E[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        return this.ref.current?.removeEventListener(type, listener, options);
    }

    public preloadRoute(pathname: string) {
        return new Promise<boolean>((resolve, reject) => {
            let found = false;
            const routes = this.props.children;
            Children.forEach<ScreenChild>(routes, (route) => {
                if (found) return; // stop after first
                if (!isValidElement(route)) return;
                const { path, caseSensitive } = route.props;
                const baseURLPattern = this.baseURLPattern.pathname;
                const matchInfo = matchRoute(path, pathname, baseURLPattern, caseSensitive);
                if (!matchInfo) return;
                found = true;
                const config = route.props.config;
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
        const prefix = this.parent?.id;
        const id = this.parentScreen?.id ?? 'root';
        return [prefix, id].filter(Boolean).join('-');
    }

    get isRoot() {
        return !this.parent;
    }

    get baseURL() {
        const pathname = this.isRoot ? window.location.pathname : this.parentScreen?.resolvedPathname!;
        const pattern = this.baseURLPattern.pathname;

        return resolveBaseURLFromPattern(pattern, pathname)!;
    }

    get baseURLPattern() {
        let baseURL = window.location.origin + "/";
        let basePath = this.props.config?.basePath;
        if (!basePath) {
            if (this.isRoot) {
                basePath = "/";
            } else {
                basePath = ".";
            }
        }

        if (this.parent && this.parentScreen) {
            const { resolvedPathname = window.location.pathname, path } = this.parentScreen;
            const parentBaseURL = this.parent.baseURL?.href;
            const pattern = new URLPattern({ baseURL: parentBaseURL, pathname: path });
            baseURL = resolveBaseURLFromPattern(
                pattern.pathname,
                resolvedPathname
            )!.href;
        }

        return new URLPattern({ baseURL, pathname: basePath });
    }

    get pathPatterns() {
        return Children.map(this.props.children, (child) => {
            return { pattern: child.props.path, caseSensitive: Boolean(child.props.caseSensitive) };
        });
    }

    get mounted() {
        return Boolean(this.ref.current);
    }

    get child() {
        return this.#child?.deref() ?? null;
    }

    set child(child: RouterBase | null) {
        const currentChildRouter = this.#child?.deref();
        if (
            currentChildRouter
            && child?.id !== currentChildRouter?.id
            && currentChildRouter?.mounted
        ) {
            throw new Error("It looks like you have two navigators at the same level. Try simplifying your navigation structure by using a nested router instead.");
        }
        if (child)
            this.#child = new WeakRef(child);
        else
            this.#child = null;
    }

    protected abstract canIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract shouldIntercept(navigateEvent: NavigateEvent): boolean;
    protected abstract intercept(navigateEvent: NavigateEvent): void;
    protected abstract get screens(): P["children"];

    render() {
        if (!this.navigation) return;
        return (
            <div
                id={this.id}
                className="react-motion-router"
                style={{ width: '100%', height: '100%' }}
                ref={this.ref}
            >
                <RouterContext.Provider value={this}>
                    <ScreenTransitionLayer
                        ref={this.screenTransitionLayer}
                        navigation={this.navigation}
                        hasUAVisualTransition={this.hasUAVisualTransition}
                    >
                        {this.screens}
                    </ScreenTransitionLayer>
                </RouterContext.Provider>
            </div>
        );
    }
}