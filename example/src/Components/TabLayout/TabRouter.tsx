import React from "react";
import { Router, RouterData, MotionProgressEvent } from "react-motion-router";
import { BackEvent, NavigateEvent } from "react-motion-router/Navigation";
import { RouterProps, RouterState } from "react-motion-router/Router";
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

export default class TabRouter extends Router<TabRouterProps, TabRouterState> {
    protected navigation: TabNavigation;

    constructor(props: RouterProps) {
        super(props);

        this.navigation = new TabNavigation(
            Math.random(),
            true,
            null,
            this.state.tabHistory,
            this.props.backBehaviour || 'none'
        );
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
        routesData: new Map<string | RegExp, any>(),
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

    onGestureNavigationEnd = () => {
        this._routerData.gestureNavigating = false;
        this.setState({implicitBack: true, gestureNavigating: false}, () => {
            this.navigation!.go(-1);
            this.props.onChangeIndex(this.navigation.history.index);
            this.setState({backNavigating: false, index: this.navigation.history.index});
            this._routerData.backNavigating = false;
        });
    }

    onBack(e: BackEvent) {
        e.stopImmediatePropagation();
        this.props.onChangeIndex(this.navigation.history.index);
        
        this.setState({backNavigating: true});

        let pathname = this.navigation!.location.pathname;
        // if (this.config.disableBrowserRouting) {
        //     pathname = this.navigation.history.current || pathname;
        // }

        if (e.detail.replaceState && !this.config.disableBrowserRouting) { // replaced state with default route
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

    onNavigate(e: NavigateEvent) {
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

    setRef = (ref: HTMLElement | null) => {
        if (this.ref) {
            this.dispatchEvent = null;
            this._routerData.navigation.dispatchEvent = this.dispatchEvent;
            this.removeNavigationEventListeners(this.ref);  
            this.ref.removeEventListener('motion-progress', this.onMotionProgress);
        }

        if (ref) {
            this.dispatchEvent = (event) => {
                return ref.dispatchEvent(event);
            }
            this._routerData.navigation.dispatchEvent = this.dispatchEvent;
            this.addNavigationEventListeners(ref);
            ref.addEventListener('motion-progress', this.onMotionProgress);
        }
    }
}