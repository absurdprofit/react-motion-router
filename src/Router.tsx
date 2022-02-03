import React, { createContext } from 'react';
import {Navigation} from './common/utils';
import AnimationLayer, { AnimationProvider } from './AnimationLayer';
import GhostLayer from './GhostLayer';
import { ScreenChild, ScreenChildren, Stack } from '.';

enum AnimationDirectionEnum {
    up,
    down,
    left,
    right,
    in,
    out
}

enum AnimationTypeEnum {
    slide,
    fade,
    zoom,
    none
}

type AnimationType = keyof typeof AnimationTypeEnum;
type AnimationDirection = keyof typeof AnimationDirectionEnum;

export interface AnimationConfig {
    type: AnimationType;
    direction?: AnimationDirection;
    duration: number;
}

interface Config {
    animation: {
        in: AnimationConfig;
        out?: AnimationConfig;
    };
    pageLoadTransition?: boolean;
    defaultRoute?: string;
}
interface RouterProps {
    config: Config;
    children: ScreenChild | ScreenChildren;
}

interface RoutesData {[key:string]: any}

interface RouterState {
    currentPath: string;
    backNavigating: boolean;
    routesData: RoutesData;
}

export class RouterData {
    private _currentPath: string = '';
    private _routesData: RoutesData = {};
    private _navigation: Navigation = new Navigation();
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
    private navigation = new Navigation();
    private config: Config;
    private _routerData: RouterData;
    private _pageLoad: boolean = true;
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
        this._routerData.animation = {
            in: this.config.animation.in,
            out: this.config.animation.out || this.config.animation.in
        };
    }
    state: RouterState = {
        currentPath: "",
        backNavigating: false,
        routesData: {}
    }

    animationDirectionSwap(animationConfig: AnimationConfig): AnimationConfig {
        if (animationConfig.type === "zoom") {
            switch(animationConfig.direction) {
                case "in":
                    return {
                        ...animationConfig,
                        direction: "out"
                    };
                
                case "out":
                    return {
                        ...animationConfig,
                        direction: "in"
                    }
                
                default:
                    return {
                        ...animationConfig,
                        direction: "out"
                    }
            }
        }

        if (animationConfig.type === "slide") {
            switch(animationConfig.direction) {
                case "right":
                    return {
                        ...animationConfig,
                        direction: "left"
                    }
                case "left":
                    return {
                        ...animationConfig,
                        direction: "right"
                    }
                case "up":
                    return {
                        ...animationConfig,
                        direction: "down"
                    }
                case "down":
                    return {
                        ...animationConfig,
                        direction: "up"
                    }
                
                default:
                    return {
                        ...animationConfig,
                        direction: "left"
                    }
            }
        }

        return animationConfig;
    }

    componentDidMount() {
        if (this.props.config.defaultRoute) {
            this.navigation.history.defaultRoute = this.props.config.defaultRoute;
        }

        // get url search params and append to existing route params
        const searchParams = this.navigation.history.searchParamsToObject(window.location.search);
        const routesData = this.state.routesData;
        if (searchParams) {
            routesData[window.location.pathname] = {
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
        window.addEventListener('go-back', ()=>{
            this.setState({backNavigating: true});
            this._pageLoad = false;

            this._routerData.backNavigating = true;
            setTimeout(() => {
                this._routerData.backNavigating = false;
                this.setState({backNavigating: false});
            }, this._routerData.animation.out.duration);
        }, true);

        window.addEventListener('popstate', (e) => {
            e.preventDefault();
            this._pageLoad = false;
            if (window.location.pathname === this.navigation.history.previous) {
                this.setState({backNavigating: true});
            }

            this._routerData.backNavigating = true;
            setTimeout(() => {
                this._routerData.backNavigating = false;
                this.setState({backNavigating: false});
            }, this._routerData.animation.out.duration);
            this._routerData.currentPath = window.location.pathname;
            this.setState({currentPath: window.location.pathname});
        }, true);
        window.addEventListener('navigate', (e : Event) => {
            e.preventDefault();
            this._pageLoad = false;
            
            const currentPath = (e as CustomEvent).detail.route;
            this._routerData.currentPath = currentPath;
            this.setState({
                currentPath: currentPath
            }, () => {
                if ((e as CustomEvent).detail.routeParams) {
                    const routesData = this.state.routesData;

                    //store per route data in object
                    //with pathname as key and route data as value
                    (routesData as any)[currentPath] = {
                        params: (e as CustomEvent).detail.routeParams
                    };


                    this.setState({routesData: routesData}, () => {
                        this._routerData.routesData = routesData;
                    });
                }
            });
        }, true);
    }

    componentWillUnmount() {
        window.removeEventListener('navigate', ()=>{});
        window.removeEventListener('popstate', ()=>{});
        window.removeEventListener('go-back', ()=>{});
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
                        duration={this._routerData.animation.in.duration}
                        shoudAnimate={Boolean(this._pageLoad || this.props.config.pageLoadTransition)}
                        currentPath={this.state.currentPath}
                        // style={!this._pageLoad || this.props.config.pageLoadTransition ? {transition: `all ${this.props.config?.animation.in.duration || 200}ms`} : undefined}
                    >
                        {this.props.children}
                    </AnimationLayer>
                </RouterDataContext.Provider>
            </div>
        );
    }
}