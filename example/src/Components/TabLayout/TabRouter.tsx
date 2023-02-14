import React from "react";
import { RouterProps, RouterState } from "@react-motion-router/stack";
import { RouterBase, RouterData } from "@react-motion-router/core";
import type {
    BackEvent,
    NavigateEvent,
    MotionProgressEvent
} from "@react-motion-router/core";
import { BackBehaviour } from "../../common/Tab/TabHistory";
import TabNavigation from "../../common/Tab/TabNavigation";

interface TabRouterProps extends RouterProps {
    backBehaviour: BackBehaviour;
    onChangeIndex(value: number): void;
    onMotionProgress(value: number): void;
    onBackNavigationChange(value: boolean): void;
}

interface TabRouterState extends RouterState {
    tabHistory: string[];
    index: number;
}

export default class TabRouter extends RouterBase<TabRouterProps, TabRouterState> {
    protected navigation: TabNavigation;
    protected _routerData: RouterData;
    readonly baseURL: URL;

    constructor(props: RouterProps) {
        super(props);

        const baseURL = props.config.basePathname ? new URL(props.config.basePathname, window.location.origin) : undefined;
        this.navigation = new TabNavigation(
            this.id,
            true,
            null,
            baseURL,
            this.state.tabHistory,
            this.props.backBehaviour || 'none'
        );
        this.baseURL = this.navigation.history.baseURL;

        this._routerData = new RouterData(this.navigation);
        
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

    state: TabRouterState = {
        currentPath: "",
        backNavigating: false,
        gestureNavigating: false,
        routesData: new Map<string, any>(),
        implicitBack: false,
        defaultDocumentTitle: document.title,
        tabHistory: React.Children.map(this.props.children, (child) => child.props.path?.toString()),
        index: 0
    };

    componentDidUpdate(lastProps: TabRouterProps, lastState: TabRouterState) {
        if (lastState.backNavigating !== this.state.backNavigating) {
            this.props.onBackNavigationChange(this.state.backNavigating);
        }
    }

    onGestureNavigationStart = () => {
        this._routerData.gestureNavigating = true;
        this.setState({gestureNavigating: true});
    }

    onAnimationEnd = () => {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({backNavigating: false});
        }
    }

    onGestureNavigationEnd = () => {
        this._routerData.gestureNavigating = false;
        this.setState({implicitBack: true, gestureNavigating: false}, () => {
            this.navigation.go(-1);
            this.setState({backNavigating: false, index: this.navigation.history.index});
            this._routerData.backNavigating = false;
        });
    }

    onPopStateListener = (e: Event) => {
        e.preventDefault();

        if (window.location.pathname === this.navigation.history.previous) {
            if (!this.state.implicitBack) {
                this.setState({backNavigating: true});
                this._routerData.backNavigating = true;
            } else {
                this.setState({implicitBack: false});
            }

            this.navigation.implicitBack();
        } else {
            if (!this.state.backNavigating && !this.state.implicitBack) {
                this.navigation.implicitNavigate(window.location.pathname);
            }
            if (this.state.implicitBack) {
                this.setState({implicitBack: false});
            }
        }

        window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
        this._routerData.currentPath = window.location.pathname;
        this.setState({currentPath: window.location.pathname});
    }

    onBackListener = (e: BackEvent) => {
        e.stopImmediatePropagation();
        this.props.onChangeIndex(this.navigation.history.index);
        
        this.setState({backNavigating: true});

        let pathname = this.navigation.location.pathname;

        if (e.detail.replace && !this.config.disableBrowserRouting) { // replaced state with default route
            this._routerData.currentPath = pathname;
            this.setState({currentPath: pathname, index: this.navigation.history.index});
        }

        if (this.config.disableBrowserRouting) {
            this._routerData.currentPath = pathname;
            this.setState({currentPath: pathname, index: this.navigation.history.index});
            if (this.state.implicitBack) {
                this.setState({implicitBack: false});
            }
        }

        window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
        this._routerData.backNavigating = true;
    }

    onNavigateListener = (e: NavigateEvent) => {
        e.stopImmediatePropagation();
        this.props.onChangeIndex(this.navigation.history.index);

        const currentPath = e.detail.route;
        this._routerData.currentPath = currentPath;
        if (e.detail.routeParams) {
            const routesData = this.state.routesData;

            //store per route data in object
            //with pathname as key and route data as value
            routesData.set(currentPath, {
                params: e.detail.routeParams
            });


            this._routerData.routesData = routesData;
            this.setState({routesData: routesData}, () => {
                this.setState({currentPath: currentPath, index: this.navigation.history.index});
            });
        } else {
            this.setState({currentPath: currentPath, index: this.navigation.history.index});
        }
    }

    onMotionProgress = (e: MotionProgressEvent) => {
        this.props.onMotionProgress(e.detail.progress);
    }

    addNavigationEventListeners(ref: HTMLElement) {
        ref.addEventListener('go-back', this.onBackListener);
        ref.addEventListener('navigate', this.onNavigateListener);
        ref.addEventListener('motion-progress', this.onMotionProgress);
    }

    removeNavigationEventListeners(ref: HTMLElement) {
        ref.removeEventListener('go-back', this.onBackListener);
        ref.removeEventListener('navigate', this.onNavigateListener);
        ref.removeEventListener('motion-progress', this.onMotionProgress);
    }
}