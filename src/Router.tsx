import React, { createContext } from 'react';
import {Navigation, BackEvent, NavigateEvent} from './common/utils';
import AnimationLayer from './AnimationLayer';
import GhostLayer from './GhostLayer';
import { ScreenChild } from '.';
import {AnimationConfig} from './common/types';



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
}
interface RouterProps {
    config: Config;
    children: ScreenChild | ScreenChild[];
}

interface RoutesData {[key:string]: any}

interface RouterState {
    currentPath: string;
    backNavigating: boolean;
    routesData: RoutesData;
    implicitBack: boolean;
}

export class RouterData {
    private _currentPath: string = '';
    private _routesData: RoutesData = {};
    private _navigation: Navigation = new Navigation(false);
    private _backNavigating: boolean = false;
    private _animation: {in: AnimationConfig; out: AnimationConfig} = {
        in: {
            type: "none",
            duration: 0,
        },
        out: {
            type: "none",
            duration: 0
        }
    };
    private _ghostLayer: GhostLayer| null = null;

    set currentPath(_currentPath: string) {
        this._currentPath = _currentPath;
    }
    set routesData(_routesData: RoutesData) {
        this._routesData = _routesData;
    }
    set navigation(_navigation: Navigation) {
        this._navigation = _navigation;
    }
    set animation(_animation: {in: AnimationConfig; out: AnimationConfig}) {
        this._animation = _animation;
    }
    set ghostLayer(_ghostLayer: GhostLayer | null) {
        this._ghostLayer = _ghostLayer;
    }
    set backNavigating(_backNavigating: boolean) {
        this._backNavigating = _backNavigating;
    }

    get currentPath() {
        return this._currentPath;
    }
    get routesData() {
        return this._routesData;
    }
    get navigation() {
        return this._navigation;
    }
    get animation() {
        return this._animation;
    }
    get ghostLayer() {
        return this._ghostLayer;
    }
    get backNavigating() {
        return this._backNavigating;
    }
}

export const RouterDataContext = createContext<RouterData>(new RouterData());
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
                    type: "fade",
                    duration: 200,
                    direction: "none"
                },
                out: {
                    type: "fade",
                    duration: 200,
                    direction: "none"
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
        routesData: {},
        implicitBack: false
    }

    componentDidMount() {
        // get url search params and append to existing route params
        const searchParams = this.navigation.history.searchParamsToObject(window.location.search);
        const routesData = this.state.routesData;
        
        if (searchParams) {
            routesData[window.location.pathname] = {
                ...this.state.routesData[window.location.pathname],
                params: searchParams
            };
        }

        let currentPath = window.location.pathname;
        if (this.props.config.defaultRoute && window.location.pathname === '/' && this.props.config.defaultRoute !== '/') {
            this.navigation.navigate(this.props.config.defaultRoute);
            currentPath = this.props.config.defaultRoute;
        }
        this.setState({currentPath: currentPath, routesData: routesData}, () => {
            this._routerData.routesData = this.state.routesData;
        });
        this._routerData.currentPath = window.location.pathname;
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
        }

        window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
        this._routerData.currentPath = window.location.pathname;
        this.setState({currentPath: window.location.pathname});
    }

    onBack(e: BackEvent) {
        this.setState({backNavigating: true});

        let pathname = window.location.pathname;
        if (this.config.disableBrowserRouting) {
            pathname = this.navigation.history.current || pathname;
        }

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
            routesData[currentPath] = {
                params: e.detail.routeParams
            };


            this.setState({routesData: routesData}, () => {
                this._routerData.routesData = routesData;
                this.setState({currentPath: currentPath});
            });
        } else {
            this.setState({currentPath: currentPath});
        }
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
                        goBack={() => {
                            this.setState({implicitBack: true}, () => {
                                this.navigation.goBack();
                            });
                        }}
                    >
                        {this.props.children}
                    </AnimationLayer>
                </RouterDataContext.Provider>
            </div>
        );
    }
}