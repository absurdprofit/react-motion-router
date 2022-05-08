import React from 'react';
import Navigation, { NavigateEvent, BackEvent } from './Navigation';
import AnimationLayer from './AnimationLayer';
import GhostLayer from './GhostLayer';
import { ScreenChild } from '.';
import {AnimationConfig} from './common/types';
import RouterData, {RoutesData, RouterDataContext} from './RouterData';

interface Config {
    animation: {
        in: AnimationConfig;
        out?: AnimationConfig;
    } | AnimationConfig;
    defaultRoute?: string;
    swipeAreaWidth?: number;
    minFlingVelocity?: number;
    hysteresis?: number;
    disableDiscovery?: boolean;
    disableBrowserRouting?: boolean;
    paramsSerialiser?(params: {[key:string]: any}): string;
    paramsDeserialiser?(queryString: string): {[key:string]: any};
}

interface RouterProps {
    config: Config;
    children: ScreenChild | ScreenChild[];
}

interface RouterState {
    currentPath: string;
    backNavigating: boolean;
    gestureNavigating: boolean;
    routesData: RoutesData;
    implicitBack: boolean;
}

export function useNavigation() {
    const routerData = React.useContext(RouterDataContext);
    return routerData.navigation;
}

export default class Router extends React.Component<RouterProps, RouterState> {
    private navigation = new Navigation(this.props.config.disableBrowserRouting || false, this.props.config.defaultRoute || null);
    private config: Config;
    private _routerData: RouterData;
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

    constructor(props: RouterProps) {
        super(props);
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

        this._routerData = new RouterData();
        this._routerData.navigation = this.navigation;
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
    
    state: RouterState = {
        currentPath: "",
        backNavigating: false,
        gestureNavigating: false,
        routesData: new Map<string | RegExp, any>(),
        implicitBack: false
    }

    componentDidMount() {
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
        window.addEventListener('go-back', this.onBackListener, true);
        window.addEventListener('popstate', this.onPopStateListener, true);
        window.addEventListener('navigate', this.onNavigateListener, true);
    }

    componentWillUnmount() {
        window.removeEventListener('navigate', this.onNavigateListener);
        window.removeEventListener('popstate', this.onPopStateListener);
        window.removeEventListener('go-back', this.onBackListener);
    }

    private onAnimationEnd() {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({backNavigating: false});
        }
    }

    onPopstate(e: Event) {
        e.preventDefault();
        if (window.location.pathname === this.navigation.history.previous) {
            if (!this.state.implicitBack) {
                this.setState({backNavigating: true});
                this._routerData.backNavigating = true;
            } else {
                this.setState({implicitBack: false});
            }

            this.navigation.implicitBack();
        } else {
            if (!this.state.backNavigating && !this.state.implicitBack) {
                this.navigation.implicitNavigate(window.location.pathname);
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
        this.setState({backNavigating: true});

        let pathname = this.navigation.location.pathname;
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
        e.preventDefault();
        
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
            this.navigation.goBack();
            this.setState({backNavigating: false});
            this._routerData.backNavigating = false;
        });
    }
    
    render() {
        return (
            <div className="react-motion-router">
                <RouterDataContext.Provider value={this._routerData}>
                    <GhostLayer
                        animation={this._routerData.animation}
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
                        navigation={this._routerData.navigation}
                        duration={this._routerData.animation.in.duration}
                        currentPath={this.state.currentPath}
                        backNavigating={this.state.backNavigating}
                        lastPath={this.navigation.history.previous}
                        onGestureNavigationStart={this.onGestureNavigationStart}
                        onGestureNavigationEnd={this.onGestureNavigationEnd}
                    >
                        {this.props.children}
                    </AnimationLayer>
                </RouterDataContext.Provider>
            </div>
        );
    }
}