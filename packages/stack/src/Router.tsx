import { RouterBase } from '@react-motion-router/core';
import type { PlainObject, RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { NestedRouterDataContext } from 'packages/core/build/RouterData';
import { ScreenProps } from './Screen';
import { NavigateEventRouterState } from './common/types';

export interface RouterProps extends RouterBaseProps {
    config: RouterBaseProps["config"] & {
        disableBrowserRouting?: boolean;
        initialRoute?: string;
    }
}

export interface RouterState extends RouterBaseState {
    backNavigating: boolean;
    nextParams?: PlainObject;
    nextConfig?: ScreenProps["config"];
}

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterDataContext>) {
        super(props, context);

        const navigation = new Navigation(this.routerData);
        this.state.navigation = navigation;
        if (props.config.disableBrowserRouting) {
            const initialRoute = new URL(props.config.initialRoute ?? '.', this.baseURL);
            this.state.currentPath = initialRoute.pathname;
        } else {
            this.state.currentPath = new URL(window.navigation.currentEntry!.url!).pathname;
        }
        this.state.backNavigating = false;
    }

    get navigation() {
        return this.routerData.navigation;
    }

    protected shouldIntercept(e: NavigateEvent): boolean {
        return e.canIntercept && !e.formData && !e.hashChange && !e.downloadRequest;
    }

    protected intercept(e: NavigateEvent): void {
        const nextPath = new URL(e.destination.url).pathname;
        const currentIndex = window.navigation.currentEntry?.index ?? 0;
        const destinationIndex = e.destination.index;
        const backNavigating = destinationIndex >= 0 && destinationIndex < currentIndex;
        const { params: nextParams, config: nextConfig } = e.destination.getState() as NavigateEventRouterState ?? {};
        if (this.animationLayer.current)
            this.animationLayer.current.direction = backNavigating ? 'reverse' : 'normal';
        const handler = async () => {
            this.setState({
                nextPath,
                backNavigating,
                nextParams,
                nextConfig
            }, this.onNextPathChange);
            await this.animationLayer.current?.finished;
            await this.state.nextScreen?.current?.load();
            this.setState({
                currentPath: nextPath,
                nextPath: undefined,
                backNavigating: false
            });
        }
        if (this.props.config.disableBrowserRouting) {
            e.preventDefault();
            handler();
        } else {
            e.intercept({ handler });
        }
    }

    private onNextPathChange = async () => {
        const nextScreen = this.state.nextScreen?.current;
        const currentScreen = this.state.currentScreen?.current;
        if (nextScreen) {
            const path = nextScreen.props.path;
            const routeData = this.routerData.routesData.get(path);
            this.routerData.routesData.set(path, {
                params: { ...routeData?.params, ...this.state.nextParams },
                config: { ...routeData?.config, ...this.state.nextConfig },
            });
        }
        if (this.state.backNavigating) {
            await Promise.all([
                nextScreen?.animationProvider?.setZIndex(0),
                currentScreen?.animationProvider?.setZIndex(1)
            ]);
        } else {
            await Promise.all([
                nextScreen?.animationProvider?.setZIndex(1),
                currentScreen?.animationProvider?.setZIndex(0)
            ]);
        }
    }
    // onNavigateListener = (e: NavigateEvent) => {
    //     if (e.detail.routerId !== this.id) return;
    //     const currentPath = e.detail.route;
    //     const routesData = this.routerData.routesData;

    //     //store per route data in object
    //     //with pathname as key and route data as value
    //     const routeData = this.routerData.routesData.get(currentPath);
    //     routesData.set(currentPath, {
    //         focused: routeData?.focused ?? false,
    //         preloaded: routeData?.preloaded ?? false,
    //         setParams: routeData?.setParams ?? (() => { }),
    //         params: e.detail.props.params ?? {},
    //         config: { ...routeData?.config, ...e.detail.props.config },
    //         setConfig: routeData?.setConfig ?? (() => { })
    //     });

    //     this.routerData.routesData = routesData;
    //     this.setState({ currentPath });
    // }
}