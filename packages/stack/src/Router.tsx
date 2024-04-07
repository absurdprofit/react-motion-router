import { RouterBase } from '@react-motion-router/core';
import type { NavigateEventRouterState, RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { RouterDataContext } from 'packages/core/build/RouterData';

export interface RouterProps extends RouterBaseProps { }

export interface RouterState extends RouterBaseState { }

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    public readonly navigation: Navigation;
    constructor(props: RouterProps) {
        super(props);

        // const defaultRoute = new URL(props.config.defaultRoute ?? '.', this.baseURL);
        this.navigation = new Navigation(
            this.routerData,
            props.config.disableBrowserRouting
        );
        // if (props.config.disableBrowserRouting) {
        //     this.state.currentPath = defaultRoute.pathname;
        // } else {
        //     this.state.currentPath = new URL(window.navigation.currentEntry!.url!).pathname;
        // }
        this.state.currentPath = new URL(window.navigation.currentEntry!.url!).pathname;
    }

    componentDidMount(): void {
        super.componentDidMount();

        window.navigation.entries().forEach((entry) => {
            if (((entry.getState() ?? {}) as NavigateEventRouterState).routerId === this.id) {
                this.routerData.addEntry(entry);
            }
        });
    }

    protected shouldIntercept(e: NavigateEvent): boolean {
        return e.canIntercept && !e.formData && !e.hashChange && !e.downloadRequest;
    }

    protected intercept(e: NavigateEvent): void {
        const currentIndex = window.navigation.currentEntry?.index ?? 0;
        const destinationIndex = e.destination.index;
        const backNavigating = destinationIndex >= 0 && destinationIndex < currentIndex;
        e.intercept({
            handler: async () => {
                this.setState({
                    nextPath: new URL(e.destination.url).pathname,
                    backNavigating
                });
                await this.animationLayer.current?.finished;
                await this.nextScreen?.load();
                this.setState({
                    currentPath: new URL(e.destination.url).pathname,
                    nextPath: undefined,
                    backNavigating
                });
            }
        });
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