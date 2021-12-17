import React, { createContext } from 'react';
import {Navigation} from './common/utils';
import {TransitionGroup} from 'react-transition-group';
import GhostLayer from './GhostLayer';

enum AnimationDirectionEnum {
    up,
    down,
    left,
    right
}

enum AnimationTypeEnum {
    slide,
    fade,
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
    animation: AnimationConfig;
}
interface RouterProps {
    config: Config;
    children: React.ReactChild[];
}
interface RouterState {
    current_path: string;
    back_navigating: boolean;
    routes_data: {[key:string]: any};
    shared_elements: string[];
}

interface RoutesData {[key:string]: any}
export class RouterData {
    private _current_path: string = '';
    private _routes_data: RoutesData = {};
    private _navigation: Navigation;
    private _animation: AnimationConfig;
    private _ghost_layer: GhostLayer| null = null;
    constructor(_navigation: Navigation, _animation: AnimationConfig) {
        this._animation = _animation;
        this._navigation = _navigation;
    }

    set current_path(_current_path: string) {
        this._current_path = _current_path;
    }
    set routes_data(_routes_data: RoutesData) {
        this._routes_data = _routes_data;
    }
    set navigation(_navigation: Navigation) {
        this._navigation = _navigation;
    }
    set animation(_animation: AnimationConfig) {
        this._animation = _animation;
    }
    set ghost_layer(_ghost_layer: GhostLayer | null) {
        this._ghost_layer = _ghost_layer;
    }
    get current_path() {
        return this._current_path;
    }
    get routes_data() {
        return this._routes_data;
    }
    get navigation() {
        return this._navigation;
    }
    get animation() {
        return this._animation;
    }
    get ghost_layer() {
        return this._ghost_layer;
    }
}

export const RouterDataContext = createContext<RouterData | null>(null);
export default class Router extends React.Component<RouterProps, RouterState> {
    private navigation = new Navigation();
    private config: Config;
    private _router_data: RouterData;
    static defaultProps = {
        config: {
            animation: {
                type: "fade",
                duration: 200,
                direction: "none"
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
                    type: "none",
                    duration: 0,
                }
            }
        }

        this._router_data = new RouterData(this.navigation, this.config.animation);
        this._router_data.animation = this.config.animation;
    }
    state: RouterState = {
        current_path: "",
        back_navigating: false,
        routes_data: {},
        shared_elements: new Array<string>()
    }

    animation_direction_swap() {
        if (this.config.animation.type === "slide") {
            const forward_direction = this.config.animation.direction;
            switch(this.config.animation.direction) {
                case "right":
                    this.config.animation.direction = "left";
                    break;
                case "left":
                    this.config.animation.direction = "right";
                    break;
                case "up":
                    this.config.animation.direction = "down";
                    break;
                case "down":
                    this.config.animation.direction = "up";
                    break;
                
                default:
                    this.config.animation.direction = "left";
            }

            this._router_data.animation = this.config.animation;
            setTimeout(() => {
                this.config.animation.direction = forward_direction;
                this._router_data.animation = this.config.animation;
            }, this.config.animation.duration);
        }
    }
    componentDidMount() {
        this._router_data.routes_data = this.state.routes_data;
        this.setState({current_path: window.location.pathname});
        this._router_data.current_path = window.location.pathname;
        window.addEventListener('go-back', ()=>{
            console.log('------Back Navigate------');
            this.setState({back_navigating: true});
            
            this.animation_direction_swap();
        }, true);

        window.addEventListener('popstate', (e) => {
            e.preventDefault();
            // const animation_config = this.config.animation;
            // if (!this.state.back_navigating) {
            //     if (this.config.animation.type !== 'fade') {
            //         this.config.animation = {
            //             type: 'none',
            //             duration: 0
            //         };
            //     }
            // }
            
            if (window.location.pathname === this.navigation.history.previous) {
                console.log("Back navigating")
                this.setState({back_navigating: true});
                this.animation_direction_swap();
            }
            this._router_data.current_path = window.location.pathname;
            this.setState({current_path: window.location.pathname}, () => {
                setTimeout(() => {
                    // this.config.animation = animation_config;
                }, this.config.animation.duration);
            });
        }, true);
        window.addEventListener('navigate', (e : Event) => {
            console.log('------Navigate------');
            e.preventDefault();
            const current_path = (e as CustomEvent).detail.route;
            this._router_data.current_path = current_path;
            this.setState({
                current_path: current_path
            }, () => {
                if ((e as CustomEvent).detail.route_params) {
                    const routes_data = this.state.routes_data;

                    //store per route data in object
                    //with pathname as key and route data as value
                    (routes_data as any)[current_path] = {
                        params: (e as CustomEvent).detail.route_params
                    };

                    

                    this.setState({routes_data: routes_data}, () => {
                        this._router_data.routes_data = routes_data;
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
                <RouterDataContext.Provider value={this._router_data}>
                    <GhostLayer instance={(instance: GhostLayer | null) => {
                        this._router_data.ghost_layer = instance;
                    }} transition_duration={this.props.config?.animation.duration} />
                    <TransitionGroup
                        style={{transition: `all ${this.props.config?.animation.duration || 200}ms`}}
                    >
                        {this.props.children}
                    </TransitionGroup>
                </RouterDataContext.Provider>
            </div>
        );
    }
}