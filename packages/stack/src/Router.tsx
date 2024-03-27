import { BackEvent, NavigateEvent, RouterBase, RouterData } from '@react-motion-router/core';
import type { RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { RouterDataContext } from 'packages/core/build/RouterData';

export interface RouterProps extends RouterBaseProps { }

export interface RouterState extends RouterBaseState { }

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    constructor(props: RouterProps, context: React.ContextType<typeof RouterDataContext>) {
        super(props, context);

        const defaultRoute = new URL(props.config.defaultRoute ?? '.', this.baseURL);
        const navigation = new Navigation(
            this.id,
            this.routerData,
            props.config.disableBrowserRouting,
            this.baseURL,
            defaultRoute
        );
        this.routerData.navigation = navigation;
        this.state.navigation = navigation;
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
        return this.routerData.navigation;
    }

    onGestureNavigationStart = () => { }

    onGestureNavigationEnd = () => { }

    onAnimationEnd = () => { }

    onBackListener = (e: BackEvent) => { }

    onNavigateListener = (e: NavigateEvent) => {
        if (e.detail.routerId !== this.id) return;
        const currentPath = e.detail.route;
        const routesData = this.routerData.routesData;

        //store per route data in object
        //with pathname as key and route data as value
        const routeData = this.routerData.routesData.get(currentPath);
        routesData.set(currentPath, {
            focused: routeData?.focused ?? false,
            preloaded: routeData?.preloaded ?? false,
            setParams: routeData?.setParams ?? (() => { }),
            params: e.detail.props.params ?? {},
            config: { ...routeData?.config, ...e.detail.props.config },
            setConfig: routeData?.setConfig ?? (() => { })
        });

        this.routerData.routesData = routesData;
        this.setState({ currentPath });
    }
}