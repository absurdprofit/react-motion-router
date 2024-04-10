import { RouterBase } from '@react-motion-router/core';
import type { NestedRouterContext, PlainObject, RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import { Navigation } from './Navigation';
import { ScreenProps } from './Screen';
import { NavigateEventRouterState } from './common/types';

export interface RouterProps extends RouterBaseProps {
    config: RouterBaseProps["config"] & {
        disableBrowserRouting?: boolean;
        initialRoute?: string;
        paramsSerializer?(params: PlainObject): string;
        paramsDeserializer?(queryString: string): PlainObject;
    }
}

export interface RouterState extends RouterBaseState {
    backNavigating: boolean;
    nextParams?: PlainObject;
    nextConfig?: ScreenProps["config"];
    transition: NavigationTransition | null;
}

export class Router extends RouterBase<RouterProps, RouterState, Navigation> {
    public readonly paramsSerializer = this.props.config.paramsSerializer;
    public readonly paramsDeserializer = this.props.config.paramsDeserializer;
    constructor(props: RouterProps, context: React.ContextType<typeof NestedRouterContext>) {
        super(props, context);

        const navigation = new Navigation(this);
        this.state.navigation = navigation;
        if (props.config.disableBrowserRouting) {
            const initialRoute = new URL(props.config.initialRoute ?? '.', this.baseURL);
            this.state.currentPath = initialRoute.pathname;
        } else {
            this.state.currentPath = new URL(window.navigation.currentEntry!.url!).pathname;
        }
        this.state.backNavigating = false;
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
        const transition = window.navigation.transition
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
                    nextConfig,
                    transition
                }, this.onNextPathChange);
                await this.animationLayer.current?.finished;
            } else {
                this.setState({
                    nextParams,
                    nextConfig,
                    transition
                }, this.onCurrentStateChange);
            }

            await this.state.nextScreen?.current?.load();
            this.setState({
                currentPath: nextPath,
                nextPath: undefined,
                transition: null,
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
            const routeData = this.routesData.get(path);
            this.routesData.set(path, {
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
            const routeData = this.routesData.get(path);
            this.routesData.set(path, {
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