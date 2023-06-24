import React from 'react';
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
import { concatenateURL, dispatchEvent, searchParamsToObject } from './common/utils';

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

export default abstract class RouterBase<P extends RouterBaseProps = RouterBaseProps, S extends RouterBaseState = RouterBaseState> extends React.Component<P, S> {
    private readonly _id: string;
    protected readonly animationLayerData = new AnimationLayerData();
    protected ref: HTMLElement | null = null;
    protected abstract _routerData: RouterData;
    protected config: Config;
    protected dispatchEvent: ((event: Event) => Promise<boolean>) | null = null;
    protected addEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined) => void) | null = null;
    protected removeEventListener: (<K extends keyof RouterEventMap>(type: K, listener: (this: HTMLElement, ev: RouterEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined) => void) | null = null;

    static defaultProps = {
        config: {
            animation: {
                in: {
                    type: "none",
                    duration: 0,
                }
            }
        }
    }

    constructor(props: RouterBaseProps) {
        super(props as P);

        this._id = props.id || Math.random().toString();
        
        if (props.config) {
            this.config = props.config;
        } else {
            this.config = {
                animation: {
                    in: {
                        type: "none",
                        duration: 0,
                    },
                    out: {
                        type: "none",
                        duration: 0,
                    }
                }
            }
        }
    }
    
    state: S = {
        currentPath: "",
        backNavigating: false,
        gestureNavigating: false,
        routesData: new Map<string, any>(),
        implicitBack: false,
        defaultDocumentTitle: document.title
    } as S;

    componentDidMount() {
        this._routerData.paramsDeserializer = this.props.config.paramsDeserializer;
        this._routerData.paramsSerializer = this.props.config.paramsSerializer;
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
        this._routerData.routesData = this.state.routesData;
        
        if (searchParams) {
            routesData.set(currentPath, {
                ...this.state.routesData.get(currentPath),
                params: searchParams
            });
        }
        this.setState({currentPath, routesData});
        this._routerData.currentPath = currentPath;
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
            const parentCurrentPath = this.parentRouterData.navigation.history.current || "";
            return concatenateURL(basePathname, concatenateURL(parentCurrentPath, parentBaseURL));
        } else {
            return new URL(basePathname, origin);
        }
    }

    protected abstract get navigation(): NavigationBase;

    abstract onAnimationEnd: (e: PageAnimationEndEvent) => void;

    abstract onGestureNavigationStart: () => void;
    abstract onGestureNavigationEnd: () => void;

    abstract onPopStateListener: (e: Event) => void;

    abstract onBackListener: (e: BackEvent) => void;

    abstract onNavigateListener: (e: NavigateEvent) => void;

    onDocumentTitleChange = (title: string | null) => {
        if (title) document.title = title;
        else document.title = this.state.defaultDocumentTitle;
    }

    addNavigationEventListeners(ref: HTMLElement) {
        ref.addEventListener('go-back', this.onBackListener);
        ref.addEventListener('navigate', this.onNavigateListener);
    }

    removeNavigationEventListeners(ref: HTMLElement) {
        ref.removeEventListener('go-back', this.onBackListener);
        ref.removeEventListener('navigate', this.onNavigateListener);
    }

    private setRef = (ref: HTMLElement | null) => {
        if (this.ref) {
            this.dispatchEvent = null;
            this.addEventListener = null;
            this.removeEventListener = null;
            this.animationLayerData.dispatchEvent = this.dispatchEvent;
            this._routerData.dispatchEvent = this.dispatchEvent;
            this._routerData.addEventListener = this.addEventListener;
            this._routerData.removeEventListener = this.removeEventListener;
            this.removeNavigationEventListeners(this.ref);  
        }

        if (ref) {
            this.dispatchEvent = (event) => {
                // return async version
                return dispatchEvent(event, ref);
            }
            this.addEventListener = (type, listener, options) => {
                return ref.addEventListener(type, listener, options);
            };
            this.removeEventListener = (type, listener, options) => {
                return ref.removeEventListener(type, listener, options);
            };
            this.animationLayerData.dispatchEvent = this.dispatchEvent;
            this._routerData.dispatchEvent = this.dispatchEvent;
            this._routerData.addEventListener = this.addEventListener;
            this._routerData.removeEventListener = this.removeEventListener;
            this.addNavigationEventListeners(ref);
        }
    }
    
    render() {
        if (!this._routerData.navigation) return <></>;
        return (
            <div id={this._id.toString()} className="react-motion-router" style={{width: '100%', height: '100%'}} ref={this.setRef}>
                <RouterDataContext.Consumer>
                    {(routerData) => {
                        this._routerData.parentRouterData = routerData;
                        return (
                            <RouterDataContext.Provider value={this._routerData}>
                                <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                                    <GhostLayer
                                        instance={(instance: GhostLayer | null) => {
                                            this._routerData.ghostLayer = instance;
                                        }}
                                        backNavigating={this.state.backNavigating}
                                        gestureNavigating={this.state.gestureNavigating}
                                        navigation={this._routerData.navigation}
                                    />
                                    {Boolean(this.navigation)
                                    && (
                                        <AnimationLayer
                                            disableBrowserRouting={this.props.config.disableBrowserRouting || false}
                                            disableDiscovery={this.props.config.disableDiscovery || false}
                                            hysteresis={this.props.config.hysteresis || 50}
                                            minFlingVelocity={this.props.config.minFlingVelocity || 400}
                                            swipeAreaWidth={this.props.config.swipeAreaWidth || 100}
                                            swipeDirection={this.props.config.swipeDirection || 'right'}
                                            navigation={this._routerData.navigation}
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
                                    )}
                                </AnimationLayerDataContext.Provider>
                            </RouterDataContext.Provider>
                        );
                    }}
                </RouterDataContext.Consumer>
                
            </div>
        );
    }
}