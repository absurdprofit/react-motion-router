import NavigationBase, { NavigateEvent, BackEvent } from './NavigationBase';
import AnimationLayer from './AnimationLayer';
import GhostLayer from './GhostLayer';
import {
    AnimationConfig,
    AnimationKeyframeEffectConfig,
    ReducedAnimationConfigSet,
    SwipeDirection,
    ScreenChild,
    PlainObject,
    RouterEventMap
} from './common/types';
import RouterData, { RoutesData, RouterDataContext } from './RouterData';
import AnimationLayerData, { AnimationLayerDataContext } from './AnimationLayerData';
import { PageAnimationEndEvent } from './MotionEvents';
import { DEFAULT_ANIMATION, concatenateURL, dispatchEvent, searchParamsToObject } from './common/utils';
import { Component } from 'react';

interface Config {
    animation?: ReducedAnimationConfigSet | AnimationConfig | AnimationKeyframeEffectConfig;
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
    currentPath: string;
    backNavigating: boolean;
    gestureNavigating: boolean;
    routesData: RoutesData;
    implicitBack: boolean;
    defaultDocumentTitle: string;
}

export default abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState> extends Component<P, S> {
    private readonly _id: string;
    protected readonly animationLayerData = new AnimationLayerData();
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

        this._id = props.id ?? Math.random().toString().replace('.', '-');
        
        if (props.config) {
            this.config = props.config;
        } else {
            this.config = {
                animation: DEFAULT_ANIMATION
            }
        }
    }
    
    state: S = {
        currentPath: "",
        backNavigating: false,
        gestureNavigating: false,
        routesData: new Map(),
        implicitBack: false,
        defaultDocumentTitle: document.title
    } as S;

    componentDidMount() {
        this._routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this._routerData.paramsSerializer = this.props.config.paramsSerializer;
        this.onPopStateListener = this.onPopStateListener.bind(this);
        window.addEventListener('popstate', this.onPopStateListener);
    }

    componentWillUnmount() {
        this.navigation.destructor();
        this._routerData.destructor();
        if (this.ref) this.removeNavigationEventListeners(this.ref);
        window.removeEventListener('popstate', this.onPopStateListener);
    }

    /**
     * Initialises current path and routes data from URL search params.
     */
    protected initialise(navigation: NavigationBase) {
        // get url search params and append to existing route params
        let currentPath = navigation.location.pathname;
        const paramsDeserializer = this._routerData.paramsDeserializer || null;
        const searchParams = searchParamsToObject(window.location.search, paramsDeserializer);
        const routesData = this.state.routesData;
        this._routerData.routesData = routesData;
        
        if (searchParams) {
            const routeData = routesData.get(currentPath);
            routesData.set(currentPath, {
                focused: routeData?.focused ?? false,
                preloaded: routeData?.preloaded ?? false,
                setParams: routeData?.setParams ?? (() => {}),
                params: searchParams,
                config: routeData?.config ?? {},
                setConfig: routeData?.setConfig ?? (() => {})
            });
        }
        this.setState({currentPath, routesData});
        this._routerData.currentPath = currentPath;

        this.animationLayerData.dispatchEvent = this.dispatchEvent;
        this.animationLayerData.addEventListener = this.addEventListener;
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
        return this._id;
    }

    protected get parentRouterData() {
        return this._routerData.parentRouterData;
    }

    protected get baseURL() {
        const origin = window.location.origin;
        const basePathname = this.props.config.basePathname || "";
        if (this.parentRouterData) {
            const parentBaseURL = this.parentRouterData.navigation.history.baseURL;
            const parentCurrentPath = this.parentRouterData.mountedScreen?.resolvedPathname || "";
            return concatenateURL(basePathname, concatenateURL(parentCurrentPath, parentBaseURL));
        } else {
            return new URL(basePathname, origin);
        }
    }

    protected abstract get navigation(): NavigationBase;

    abstract onAnimationEnd: (e: PageAnimationEndEvent) => void;

    abstract onGestureNavigationStart: () => void;
    abstract onGestureNavigationEnd:() => void;

    protected onPopStateListener(e: Event) {
        let currentPath = this.navigation.location.pathname;
        const paramsDeserializer = this._routerData.paramsDeserializer || null;
        const searchParams = searchParamsToObject(window.location.search, paramsDeserializer);
        const routesData = this.state.routesData;
        this._routerData.routesData = this.state.routesData;
        
        if (searchParams) {
            const routeData = this.state.routesData.get(currentPath);
            routesData.set(currentPath, {
                focused: routeData?.focused ?? false,
                preloaded: routeData?.preloaded ?? false,
                setParams: routeData?.setParams ?? (() => {}),
                params: searchParams,
                config: routeData?.config ?? {},
                setConfig: routeData?.setConfig ?? (() => {})
            });
        }
        this.setState({routesData});
    };

    abstract onBackListener: (e: BackEvent) => void;

    abstract onNavigateListener: (e: NavigateEvent) => void;

    protected onDocumentTitleChange = (title: string | null) => {
        if (title) document.title = title;
        else document.title = this.state.defaultDocumentTitle;
    }

    addNavigationEventListeners(ref: HTMLElement) {
        ref.addEventListener('go-back', this.onBackListener, {capture: true});
        ref.addEventListener('navigate', this.onNavigateListener, {capture: true});
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
            <div id={this._id.toString()} className="react-motion-router" style={{width: '100%', height: '100%'}} ref={this.setRef}>
                <RouterDataContext.Consumer>
                    {(routerData) => {
                        this._routerData.parentRouterData = routerData;
                        if (!this._routerData.navigation) return;
                        return (
                            <RouterDataContext.Provider value={this._routerData}>
                                <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                                    <GhostLayer
                                        backNavigating={this.state.backNavigating}
                                        gestureNavigating={this.state.gestureNavigating}
                                        navigation={this.navigation}
                                        animationLayerData={this.animationLayerData}
                                    />
                                    <AnimationLayer
                                        animationLayerData={this.animationLayerData}
                                        disableBrowserRouting={this.props.config.disableBrowserRouting || false}
                                        disableDiscovery={this.props.config.disableDiscovery || false}
                                        hysteresis={this.props.config.hysteresis || 50}
                                        minFlingVelocity={this.props.config.minFlingVelocity || 400}
                                        swipeAreaWidth={this.props.config.swipeAreaWidth || 100}
                                        swipeDirection={this.props.config.swipeDirection || 'right'}
                                        navigation={this.navigation}
                                        ghostLayer={this.animationLayerData.ghostLayer}
                                        backNavigating={this.state.backNavigating}
                                        currentPath={this.navigation.history.current}
                                        lastPath={this.navigation.history.previous}
                                        onGestureNavigationStart={this.onGestureNavigationStart}
                                        onGestureNavigationEnd={this.onGestureNavigationEnd}
                                        onDocumentTitleChange={this.onDocumentTitleChange}
                                        dispatchEvent={this.dispatchEvent}
                                    >
                                        {this.props.children}
                                    </AnimationLayer>
                                </AnimationLayerDataContext.Provider>
                            </RouterDataContext.Provider>
                        );
                    }}
                </RouterDataContext.Consumer>
                
            </div>
        );
    }
}