import React, {createContext} from 'react';
import { AnimationConfigSet } from './common/types';
import GhostLayer from './GhostLayer';
import NavigationBase from './NavigationBase';
import { ScrollRestorationData } from './ScrollRestorationData';

export type RoutesData = Map<string | undefined, {[key:string]: any}>;

export default class RouterData<N extends NavigationBase = NavigationBase> {
    private _currentPath: string = '';
    private _routesData: RoutesData = new Map();
    private static _scrollRestorationData = new ScrollRestorationData();
    private _navigation?: N;
    private _backNavigating: boolean = false;
    private _gestureNavigating: boolean = false;
    private _paramsSerialiser?: (params: {[key:string]: any}) => string;
    private _paramsDeserialiser?:(queryString: string) => {[key:string]: any};
    private _animation: AnimationConfigSet = {
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

    constructor(navigation?: N) {
        this._navigation = navigation;
    }

    set currentPath(_currentPath: string) {
        this._currentPath = _currentPath;
    }
    set routesData(_routesData: RoutesData) {
        this._routesData = _routesData;
    }
    set navigation(_navigation: N) {
        this._navigation = _navigation;
    }
    set animation(_animation: AnimationConfigSet) {
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
    set paramsSerialiser(_paramsSerialiser: ((params: {[key:string]: any}) => string) | undefined) {
        this._paramsSerialiser = _paramsSerialiser;
    }
    set paramsDeserialiser(_paramsDeserialiser: ((queryString: string) => {[key:string]: any}) | undefined) {
        this._paramsDeserialiser = _paramsDeserialiser;
    }

    get currentPath() {
        return this._currentPath;
    }
    get routesData() {
        return this._routesData;
    }
    get scrollRestorationData() {
        return RouterData._scrollRestorationData;
    }
    get navigation(): N {
        return this._navigation!;
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
    get paramsSerialiser(): ((params: {[key:string]: any}) => string) | undefined {
        return this._paramsSerialiser;
    }
    get paramsDeserialiser():( (queryString: string) => {[key:string]: any}) | undefined {
        return this._paramsDeserialiser;
    }
}

export const RouterDataContext = createContext<RouterData | null>(null);
