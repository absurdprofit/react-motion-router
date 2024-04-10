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
    transition?: NavigationTransition;
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
        return e.canIntercept
            && !e.formData
            && !e.hashChange
            && !e.downloadRequest
            && e.navigationType !== "reload";
    }

    protected intercept(e: NavigateEvent): void {
        const currentPath = this.state.currentPath;
        const nextPath = new URL(e.destination.url).pathname;
        const currentIndex = window.navigation.currentEntry?.index ?? 0;
        const destinationIndex = e.destination.index;
        const backNavigating = destinationIndex >= 0 && destinationIndex < currentIndex;
        const { params: nextParams, config: nextConfig } = e.destination.getState() as NavigateEventRouterState ?? {};
        if (this.animationLayer.current)
            this.animationLayer.current.direction = backNavigating ? 'reverse' : 'normal';
        const handler = async () => {
            if (currentPath !== nextPath && e.navigationType !== "replace") {
                this.setState({
                    nextPath,
                    backNavigating,
                    nextParams,
                    nextConfig
                }, this.onNextPathChange);
                await this.animationLayer.current?.finished;
            } else {
                this.setState({
                    nextParams,
                    nextConfig
                }, this.onCurrentStateChange);
            }

            await this.state.nextScreen?.current?.load();
            this.setState({
                currentPath: nextPath,
                nextPath: undefined,
                transition: undefined,
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

    private onCurrentStateChange = async () => {
        const currentScreen = this.state.currentScreen?.current;
        if (currentScreen) {
            const path = currentScreen.props.path;
            const routeData = this.routerData.routesData.get(path);
            this.routerData.routesData.set(path, {
                params: { ...routeData?.params, ...this.state.nextParams },
                config: { ...routeData?.config, ...this.state.nextConfig },
            });
            this.setState({ nextParams: undefined, nextConfig: undefined });
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
            this.setState({ nextParams: undefined, nextConfig: undefined });
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
}