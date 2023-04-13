import React from "react";
import { RouterBase, RouterBaseProps, RouterBaseState, RouterData } from "@react-motion-router/core";
import type {
    BackEvent,
    NavigateEvent,
    MotionProgressEvent
} from "@react-motion-router/core";
import { BackBehaviour } from "../../common/Tab/TabHistory";
import TabNavigation from "../../common/Tab/TabNavigation";
import { TabChild } from "./TabLayout";

interface TabRouterProps extends RouterBaseProps {
    backBehaviour: BackBehaviour;
    onChangeIndex(value: number): void;
    onMotionProgress(value: number): void;
    onBackNavigationChange(value: boolean): void;
    onMount?(navigation: TabNavigation): void;
}

interface TabRouterState extends RouterBaseState {
    tabHistory: string[];
    index: number;
}

export default class TabRouter extends RouterBase<TabRouterProps, TabRouterState> {
    protected _routerData: RouterData<TabNavigation>;

    constructor(props: RouterBaseProps) {
        super(props);
        
        this._routerData = new RouterData<TabNavigation>(this);
        
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

        if (!this.config.animation) {
            this.config.animation = {
                type: "none",
                duration: 0
            }
        }
        if ('in' in this.config?.animation) {
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

    componentDidMount(): void {
        super.componentDidMount();
        this._routerData.navigation = new TabNavigation(
            this.id,
            this._routerData,
            true,
            null,
            this.baseURL,
            this.state.tabHistory,
            this.props.backBehaviour || 'none'
        );
        this.initialise(this.navigation);
        if (this.props.onMount) this.props.onMount(this.navigation);
    }

    componentDidUpdate(_: TabRouterProps, lastState: TabRouterState) {
        if (lastState.backNavigating !== this.state.backNavigating) {
            this.props.onBackNavigationChange(this.state.backNavigating);
        }
    }

    get navigation() {
        return this._routerData.navigation;
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

    onPopStateListener = (e: Event) => {}

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