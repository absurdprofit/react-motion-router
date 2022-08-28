import React from 'react';
import NavigationBase, { NavigateEvent, BackEvent } from './NavigationBase';
import AnimationLayer from './AnimationLayer';
import GhostLayer from './GhostLayer';
import { ScreenChild } from '.';
import {AnimationConfig, AnimationKeyframeEffectConfig, HistoryLike, NavigationLike, ReducedAnimationConfigSet, SwipeDirection} from './common/types';
import RouterData, {RoutesData, RouterDataContext} from './RouterData';
import AnimationLayerData, {AnimationLayerDataContext} from './AnimationLayerData';

interface Config {
    animation: ReducedAnimationConfigSet | AnimationConfig | AnimationKeyframeEffectConfig;
    defaultRoute?: string;
    swipeAreaWidth?: number;
    minFlingVelocity?: number;
    hysteresis?: number;
    disableDiscovery?: boolean;
    swipeDirection?: SwipeDirection;
    disableBrowserRouting?: boolean;
    paramsSerialiser?(params: {[key:string]: any}): string;
    paramsDeserialiser?(queryString: string): {[key:string]: any};
}

export interface RouterBaseProps {
    config: Config;
    children: ScreenChild | ScreenChild[];
    onMount?(navigation: NavigationLike): void;
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
    private id: number = Math.random();
    protected ref: HTMLElement | null = null;
    protected navigation: NavigationBase;
    protected config: Config;
    protected _routerData: RouterData;
    protected dispatchEvent: ((event: Event) => boolean) | null = null;
    private animationLayerData = new AnimationLayerData();
    private onBackListener = this.onBack.bind(this) as EventListener;
    private onNavigateListener = this.onNavigate.bind(this) as EventListener;
    private onPopStateListener = this.onPopstate.bind(this);

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
        
        this.navigation = new NavigationLike(
            this.id,
            props.config.disableBrowserRouting,
            props.config.defaultRoute,
            new HistoryLike(props.config.defaultRoute)
        );
        this._routerData = new RouterData(this.navigation);
        
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

        if ('in' in this.config.animation) {
            this._routerData.animation = {
                in: this.config.animation.in,
                out: this.config.animation.out || this.config.animation.in
            };
        } else {
            this._routerData.animation = {
                in: this.config.animation,
                out: this.config.animation
            };
        }
    }
    
    state: S = {
        currentPath: "",
        backNavigating: false,
        gestureNavigating: false,
        routesData: new Map<string | RegExp, any>(),
        implicitBack: false,
        defaultDocumentTitle: document.title
    } as S;

    componentDidMount() {
        this._routerData.navigation = this.navigation;
        // get url search params and append to existing route params
        this.navigation.paramsDeserialiser = this.config.paramsDeserialiser;
        this.navigation.paramsSerialiser = this.config.paramsSerialiser;
        const searchParams = this.navigation.searchParamsToObject(window.location.search);
        const routesData = this.state.routesData;
        
        if (searchParams) {
            routesData.set(this.navigation.location.pathname, {
                ...this.state.routesData.get(this.navigation.location.pathname),
                params: searchParams
            });
        }

        let currentPath = this.navigation.location.pathname;
        if (this.props.config.defaultRoute && this.navigation.location.pathname === '/' && this.props.config.defaultRoute !== '/') {
            this.navigation.navigate(this.props.config.defaultRoute);
            currentPath = this.props.config.defaultRoute;
        }
        this._routerData.routesData = this.state.routesData;
        this._routerData.paramsDeserialiser = this.props.config.paramsDeserialiser;
        this._routerData.paramsSerialiser = this.props.config.paramsSerialiser;
        this.setState({currentPath: currentPath, routesData: routesData});
        this._routerData.currentPath = this.navigation.location.pathname;
        window.addEventListener('popstate', this.onPopStateListener);

        if (this.props.onMount) this.props.onMount(this.navigation);
    }

    componentWillUnmount() {
        if (this.ref) this.removeNavigationEventListeners(this.ref);
        window.removeEventListener('popstate', this.onPopStateListener);
    }

    protected onAnimationEnd() {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({backNavigating: false});
        }
    }

    onPopstate(e: Event) {
        e.preventDefault();
        if (window.location.pathname === this.navigation!.history.previous) {
            if (!this.state.implicitBack) {
                this.setState({backNavigating: true});
                this._routerData.backNavigating = true;
            } else {
                this.setState({implicitBack: false});
            }

            this.navigation!.implicitBack();
        } else {
            if (!this.state.backNavigating && !this.state.implicitBack) {
                this.navigation!.implicitNavigate(window.location.pathname);
            }
            if (this.state.implicitBack) {
                this.setState({implicitBack: false});
            }
        }

        window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
        this._routerData.currentPath = window.location.pathname;
        this.setState({currentPath: window.location.pathname});
    }

    onBack(e: BackEvent) {
        e.stopImmediatePropagation();
        this.setState({backNavigating: true});

        let pathname = this.navigation!.location.pathname;
        // if (this.config.disableBrowserRouting) {
        //     pathname = this.navigation.history.current || pathname;
        // }

        if (e.detail.replaceState && !this.config.disableBrowserRouting) { // replaced state with default route
            this._routerData.currentPath = pathname;
            this.setState({currentPath: pathname});
        }

        if (this.config.disableBrowserRouting) {
            this._routerData.currentPath = pathname;
            this.setState({currentPath: pathname});
            if (this.state.implicitBack) {
                this.setState({implicitBack: false});
            }
        }

        window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
        this._routerData.backNavigating = true;
    }

    onNavigate(e: NavigateEvent) {
        e.stopImmediatePropagation();
        const currentPath = e.detail.route;
        this._routerData.currentPath = currentPath;
        if (e.detail.routeParams) {
            const routesData = this.state.routesData;

            //store per route data in object
            //with pathname as key and route data as value
            routesData.set(currentPath, {
                params: e.detail.routeParams
            });


            this._routerData.routesData = routesData;
            this.setState({routesData: routesData}, () => {
                this.setState({currentPath: currentPath});
            });
        } else {
            this.setState({currentPath: currentPath});
        }
    }

    onGestureNavigationStart = () => {
        this._routerData.gestureNavigating = true;
        this.setState({gestureNavigating: true});
    }

    onGestureNavigationEnd = () => {
        this._routerData.gestureNavigating = false;
        this.setState({implicitBack: true, gestureNavigating: false}, () => {
            this.navigation!.goBack();
            this.setState({backNavigating: false});
            this._routerData.backNavigating = false;
        });
    }

    onDocumentTitleChange = (title: string | null) => {
        if (title) document.title = title;
        else document.title = this.state.defaultDocumentTitle;
    }

    addNavigationEventListeners(ref: HTMLElement) {
        ref.addEventListener('go-back', this.onBackListener);
        ref.addEventListener('navigate', this.onNavigateListener);
    }

    removeNavigationEventListeners(ref: HTMLElement) {
        ref.addEventListener('go-back', this.onBackListener);
        ref.addEventListener('navigate', this.onNavigateListener);
    }

    setRef = (ref: HTMLElement | null) => {
        if (!this._routerData.navigation) return;

        if (this.ref) {
            this.dispatchEvent = null;
            this._routerData.navigation.dispatchEvent = this.dispatchEvent;
            this.removeNavigationEventListeners(this.ref);  
        }

        if (ref) {
            this.dispatchEvent = (event) => {
                return ref.dispatchEvent(event);
            }
            this._routerData.navigation.dispatchEvent = this.dispatchEvent;
            this.addNavigationEventListeners(ref);
        }
    }
    
    render() {
        if (!this._routerData.navigation) return <></>;
        
        return (
            <div id={this.navigation.history.baseURL.pathname} className="react-motion-router" style={{width: '100%', height: '100%'}} ref={this.setRef}>
                <RouterDataContext.Provider value={this._routerData}>
                    <AnimationLayerDataContext.Provider value={this.animationLayerData}>
                        <GhostLayer
                            instance={(instance: GhostLayer | null) => {
                                this._routerData.ghostLayer = instance;
                            }}
                            backNavigating={this.state.backNavigating}
                        />
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
                    </AnimationLayerDataContext.Provider>
                </RouterDataContext.Provider>
            </div>
        );
    }
}