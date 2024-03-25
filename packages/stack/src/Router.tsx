import { BackEvent, NavigateEvent, RouterBase, RouterData } from '@react-motion-router/core';
import type { RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { RouterDataContext } from 'packages/core/build/RouterData';

export interface RouterProps extends RouterBaseProps { }

export interface RouterState extends RouterBaseState { }

export class Router extends RouterBase {
    protected _routerData: RouterData<Navigation>;

    constructor(props: RouterProps, context: React.ContextType<typeof RouterDataContext>) {
        super(props, context);

        this._routerData = new RouterData(this);
        const defaultRoute = new URL(props.config.defaultRoute ?? '/', this.baseURL);
        this._routerData.navigation = new Navigation(
            this.id,
            this._routerData,
            props.config.disableBrowserRouting,
            this.baseURL,
            defaultRoute
        );
        this.state.currentPath = this.baseURL.pathname;
    }

    componentDidMount(): void {
        super.componentDidMount();
    }

    get navigation() {
        return this._routerData.navigation;
    }

    onGestureNavigationStart = () => {
        this._routerData.gestureNavigating = true;
        this.setState({ gestureNavigating: true });
    }

    onGestureNavigationEnd = () => {
        this._routerData.gestureNavigating = false;
        this.setState({ implicitBack: true, gestureNavigating: false }, () => {
            this.navigation.goBack();
            this.setState({ backNavigating: false });
            this._routerData.backNavigating = false;
        });
    }

    onAnimationEnd = () => {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({ backNavigating: false });
        }
    }

    onBackListener = (e: BackEvent) => {
        if (e.detail.routerId !== this.id) return;
        let pathname = this.navigation.current.route;

        if (!this.props.config.disableBrowserRouting) { // replaced state with default route
            this.setState({ currentPath: pathname });
        }

        if (this.props.config.disableBrowserRouting) {
            this.setState({ currentPath: pathname });
            if (this.state.implicitBack) {
                this.setState({ implicitBack: false });
            }
        }

        if (!this.state.backNavigating) {
            if (!this.state.implicitBack) {
                this.setState({ backNavigating: true }, () => {
                    // this.animationLayerData.finished.then(this.onAnimationEnd.bind(this));
                });
                this._routerData.backNavigating = true;
            } else {
                this.setState({ implicitBack: false });
            }
        }
    }

    onNavigateListener = (e: NavigateEvent) => {
        if (e.detail.routerId !== this.id) return;
        const currentPath = e.detail.route;
        const routesData = this._routerData.routesData;

        //store per route data in object
        //with pathname as key and route data as value
        const routeData = this._routerData.routesData.get(currentPath);
        routesData.set(currentPath, {
            focused: routeData?.focused ?? false,
            preloaded: routeData?.preloaded ?? false,
            setParams: routeData?.setParams ?? (() => { }),
            params: e.detail.props.params ?? {},
            config: { ...routeData?.config, ...e.detail.props.config },
            setConfig: routeData?.setConfig ?? (() => { })
        });

        this._routerData.routesData = routesData;
        this.setState({ currentPath });
    }
}