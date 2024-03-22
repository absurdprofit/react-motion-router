import { BackEvent, DEFAULT_ANIMATION, NavigateEvent, RouterBase, RouterData } from '@react-motion-router/core';
import type { RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import { Navigation } from './Navigation';

export interface RouterProps extends RouterBaseProps {}

export interface RouterState extends RouterBaseState {}

export class Router extends RouterBase {
    protected _routerData: RouterData<Navigation>;

    constructor(props: RouterProps) {
        super(props);

        this._routerData = new RouterData(this);

        if (!this.config.animation) {
            this.config.animation = DEFAULT_ANIMATION;
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
    
    componentDidMount(): void {
        super.componentDidMount();
        const defaultRoute = new URL(this.props.config.defaultRoute ?? '/', this.baseURL);
        this._routerData.navigation = new Navigation(
            this.id,
            this._routerData,
            this.props.config.disableBrowserRouting,
            defaultRoute
        );
        this.initialise(this.navigation);
    }

    get navigation() {
        return this._routerData.navigation;
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

    onAnimationEnd = () => {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({backNavigating: false});
        }
    }

    onBackListener = (e: BackEvent) => {
        if (e.detail.routerId !== this.id) return;
        let pathname = this.navigation.current.route;

        if (!this.config.disableBrowserRouting) { // replaced state with default route
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

        if (!this.state.backNavigating) {
            if (!this.state.implicitBack) {
                this.setState({backNavigating: true}, () => {
                    // this.animationLayerData.finished.then(this.onAnimationEnd.bind(this));
                });
                this._routerData.backNavigating = true;
            } else {
                this.setState({implicitBack: false});
            }
        }
    }

    onNavigateListener = (e: NavigateEvent) => {
        if (e.detail.routerId !== this.id) return;
        const currentPath = e.detail.route;
        this._routerData.currentPath = currentPath;
        const routesData = this.state.routesData;

        //store per route data in object
        //with pathname as key and route data as value
        const routeData = this.state.routesData.get(currentPath);
        routesData.set(currentPath, {
            focused: routeData?.focused ?? false,
            preloaded: routeData?.preloaded ?? false,
            setParams: routeData?.setParams ?? (() => {}),
            params: e.detail.props.params ?? {},
            config: { ...routeData?.config, ...e.detail.props.config },
            setConfig: routeData?.setConfig ?? (() => {})
        });

        this._routerData.routesData = routesData;
        this.setState({routesData: routesData}, () => {
            this.setState({currentPath: currentPath});
        });
    }
}