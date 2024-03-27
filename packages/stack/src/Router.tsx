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
        const defaultRoute = new URL(props.config.defaultRoute ?? '.', this.baseURL);
        this._routerData.navigation = new Navigation(
            this.id,
            this._routerData,
            props.config.disableBrowserRouting,
            this.baseURL,
            defaultRoute
        );
        if (props.config.disableBrowserRouting) {
            this.state.currentPath = defaultRoute.pathname;
        } else {
            this.state.currentPath = window.location.pathname;
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
    }

    get navigation() {
        return this._routerData.navigation;
    }

    onGestureNavigationStart = () => {}

    onGestureNavigationEnd = () => {}

    onAnimationEnd = () => {}

    onBackListener = (e: BackEvent) => {}

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