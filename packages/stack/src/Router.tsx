import React from 'react';
import { BackEvent, NavigateEvent, RouterBase, RouterData } from '@react-motion-router/core';
import type { RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import Navigation from './Navigation';
import History from './History';

export interface RouterProps extends RouterBaseProps {}

export interface RouterState extends RouterBaseState {}

export default class Router extends RouterBase {
    protected _routerData: RouterData<Navigation>;

    constructor(props: RouterProps) {
        super(props);

        this._routerData = new RouterData(this);

        if (!this.config.animation) {
            this.config.animation = {
                type: "none",
                duration: 0
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
    
    componentDidMount(): void {
        super.componentDidMount();
        this._routerData.navigation = new Navigation(
            this.id,
            this._routerData,
            new History(this.id, this.props.config.defaultRoute ?? null, this.baseURL),
            this.animationLayerData,
            this.props.config.disableBrowserRouting,
            this.props.config.defaultRoute
        );
        this.initialise(this.navigation);
    }

    get navigation() {
        return this._routerData.navigation;
    }

    onGestureNavigationStart = () => {
        this._routerData.gestureNavigating = true;
        this.setState({gestureNavigating: true});
    }

    onGestureNavigationEnd = () => {
        this._routerData.gestureNavigating = false;
        this.setState({implicitBack: true, gestureNavigating: false}, () => {
            this.navigation.goBack();
            this.setState({backNavigating: false});
            this._routerData.backNavigating = false;
        });
    }

    onAnimationEnd = () => {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({backNavigating: false});
        }
    }

    onPopStateListener = (e: Event) => {}

    onBackListener = (e: BackEvent) => {
        e.stopImmediatePropagation();

        let pathname = this.navigation.location.pathname;

        if (e.detail.replace && !this.config.disableBrowserRouting) { // replaced state with default route
            this._routerData.currentPath = pathname;
            this.setState({currentPath: pathname});
        }

        if (this.config.disableBrowserRouting) {
            this._routerData.currentPath = pathname;
            this.setState({currentPath: pathname});
            if (this.state.implicitBack) {
                this.setState({implicitBack: false});
            }
        }

        if (!this.state.backNavigating && !this.state.implicitBack) {
            this.setState({backNavigating: true});
            window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
            this._routerData.backNavigating = true;
        }
    }

    onNavigateListener = (e: NavigateEvent) => {
        e.stopImmediatePropagation();
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
                this.setState({currentPath: currentPath});
            });
        } else {
            this.setState({currentPath: currentPath});
        }
    }
}