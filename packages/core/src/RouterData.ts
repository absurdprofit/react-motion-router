import React, {createContext} from 'react';
import { AnimationConfigSet, SearchParamsDeserializer, SearchParamsSerializer } from './common/types';
import { defaultSearchParamsToObject } from './common/utils';
import GhostLayer from './GhostLayer';
import NavigationBase from './NavigationBase';
import { ScrollRestorationData } from './ScrollRestorationData';

export type RoutesData = Map<string | undefined, {[key:string]: any}>;

export default class RouterData<N extends NavigationBase = NavigationBase> {
    private _dispatchEvent: ((event: Event) => Promise<boolean>) | null = null;
    private _currentPath: string = '';
    private _routesData: RoutesData = new Map();
    private static _scrollRestorationData = new ScrollRestorationData();
    private _navigation?: N;
    private _backNavigating: boolean = false;
    private _gestureNavigating: boolean = false;
    private _paramsSerializer?: SearchParamsSerializer;
    private _paramsDeserializer?: SearchParamsDeserializer;
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
        if (navigation) {
            this.navigation = navigation;
        }
    }

    set dispatchEvent(_dispatchEvent: ((event: Event) => Promise<boolean>) | null) {
        this._dispatchEvent = _dispatchEvent;
        if (this._navigation)
            this._navigation.dispatchEvent = _dispatchEvent
    }

    set currentPath(_currentPath: string) {
        this._currentPath = _currentPath;
    }
    set routesData(_routesData: RoutesData) {
        this._routesData = _routesData;
    }
    set navigation(_navigation: N) {
        this._navigation = _navigation;
        _navigation.paramsDeserializer = this._paramsDeserializer;
        _navigation.paramsSerializer = this._paramsSerializer;
        _navigation.dispatchEvent = this._dispatchEvent;
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
    set paramsSerializer(_paramsSerializer: ((params: {[key:string]: any}) => string) | undefined) {
        this._paramsSerializer = _paramsSerializer;
        if (this._navigation)
            this._navigation.paramsSerializer = _paramsSerializer;
    }
    set paramsDeserializer(_paramsDeserializer: ((queryString: string) => {[key:string]: any}) | undefined) {
        this._paramsDeserializer = _paramsDeserializer;
        if (this._navigation)
            this._navigation.paramsDeserializer = _paramsDeserializer;
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
    get paramsSerializer(): ((params: {[key:string]: any}) => string) | undefined {
        return this._paramsSerializer;
    }
    get paramsDeserializer():( (queryString: string) => {[key:string]: any}) | undefined {
        return this._paramsDeserializer;
    }
}

export const RouterDataContext = createContext<RouterData | null>(null);