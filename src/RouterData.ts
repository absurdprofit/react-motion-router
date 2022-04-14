import React, {createContext} from 'react';
import { Navigation } from './common/utils';
import { AnimationConfig } from './common/types';
import GhostLayer from './GhostLayer';

// export interface RoutesData {[key:string]: any}
export type RoutesData = Map<string | RegExp | undefined, {[key:string]: any}>;

export default class RouterData {
    private _currentPath: string | undefined = '';
    private _routesData: RoutesData = new Map();
    private _navigation: Navigation = new Navigation(false);
    private _backNavigating: boolean = false;
    private _gestureNavigating: boolean = false;
    private _animation: {in: AnimationConfig; out: AnimationConfig} = {
        in: {
            type: "none",
            duration: 0,
        },
        out: {
            type: "none",
            duration: 0
        }
    };
    private _ghostLayer: GhostLayer | null = null;

    set currentPath(_currentPath: string | undefined) {
        this._currentPath = _currentPath;
    }
    set routesData(_routesData: RoutesData) {
        this._routesData = _routesData;
    }
    set navigation(_navigation: Navigation) {
        this._navigation = _navigation;
    }
    set animation(_animation: {in: AnimationConfig; out: AnimationConfig}) {
        this._animation = _animation;
    }
    set ghostLayer(_ghostLayer: GhostLayer | null) {
        this._ghostLayer = _ghostLayer;
    }
    set backNavigating(_backNavigating: boolean) {
        this._backNavigating = _backNavigating;
    }
    set gestureNavigating(_gestureNavigating: boolean) {
        this._gestureNavigating = _gestureNavigating;
    }

    get currentPath() {
        return this._currentPath;
    }
    get routesData() {
        return this._routesData;
    }
    get navigation() {
        return this._navigation;
    }
    get animation() {
        return this._animation;
    }
    get ghostLayer() {
        return this._ghostLayer;
    }
    get backNavigating() {
        return this._backNavigating;
    }
    get gestureNavigating() {
        return this._gestureNavigating;
    }
}

export const RouterDataContext = createContext<RouterData>(new RouterData());