import React from 'react';
import { BackEvent, NavigateEvent, RouterBase, RouterData } from '@react-motion-router/core';
import type { RouterBaseProps, RouterBaseState } from '@react-motion-router/core';
import Navigation from './Navigation';
import History from './History';

export interface RouterProps extends RouterBaseProps {}

export interface RouterState extends RouterBaseState {}

export default class Router extends RouterBase {
    navigation: Navigation;
    _routerData: RouterData;

    constructor(props: RouterProps) {
        super(props);

        this.navigation = new Navigation(
            this.id,
            new History(props.config.defaultRoute ?? null),
            props.config.disableBrowserRouting,
            props.config.defaultRoute
        );
        this._routerData = new RouterData(this.navigation);

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

    onAnimationEnd = () => {
        if (this.state.backNavigating) {
            this._routerData.backNavigating = false;
            this.setState({backNavigating: false});
        }
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
        this.setState({backNavigating: true});

        let pathname = this.navigation.location.pathname;

        if (e.detail.replaceState && !this.config.disableBrowserRouting) { // replaced state with default route
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

        window.addEventListener('page-animation-end', this.onAnimationEnd.bind(this), {once: true});
        this._routerData.backNavigating = true;
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