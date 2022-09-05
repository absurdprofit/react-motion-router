import { ParamsDeserialiser, ParamsSerialiser } from "./common/types";
import HistoryBase from "./HistoryBase";
import MetaData from "./MetaData";

export type BackEvent = CustomEvent<{replaceState:boolean}>;
export interface NavigateEventDetail {
    id: number;
    route: string;
    routeParams?: any;
}

export type NavigateEvent = CustomEvent<NavigateEventDetail>;

export default abstract class NavigationBase {
    private _id: number;
    private _metaData = new MetaData();
    protected abstract _history: HistoryBase;
    // private _history;
    protected readonly _disableBrowserRouting: boolean;
    protected _currentParams: {[key:string]: any} = {};
    // private _currentParams: {[key:string]: any} = {};
    private _paramsSerialiser?: ParamsSerialiser;
    private _paramsDeserialiser?: ParamsDeserialiser;
    protected _dispatchEvent: ((event: Event) => boolean) | null = null;
    // private _dispatchEvent: ((event: Event) => boolean) | null = null;

    constructor(_id: number, _disableBrowserRouting: boolean = false, _defaultRoute: string | null = null) {
        this._disableBrowserRouting = _disableBrowserRouting;
        this._id = _id;
    }

    get id() {
        return this._id;
    }

    abstract navigate(route: string, routeParams?: {[key:string]: any}, replace?: boolean): void;

    abstract goBack(): void;

    searchParamsToObject(searchPart: string) {
        const deserialiser = this._paramsDeserialiser || this._history.searchParamsToObject;
        this._currentParams = deserialiser(searchPart) || {};
        return this._currentParams;
    }

    searchParamsFromObject(params: {[key: string]: any}) {
        try {
            const serialiser = this._paramsSerialiser || function(paramsObj) {
                return new URLSearchParams(paramsObj).toString();
            }
            return serialiser(params);
        } catch (e) {
            console.error(e);
            console.warn("Non JSON serialisable value was passed as route param to Anchor.");
        }
        return '';
    }

    set dispatchEvent(_dispatchEvent: ((event: Event) => boolean) | null) {
        this._dispatchEvent = _dispatchEvent;
    }

    set paramsDeserialiser(_paramsDeserialiser: ParamsDeserialiser | undefined) {
        this._paramsDeserialiser = _paramsDeserialiser;
    }

    set paramsSerialiser(_paramsSerialiser: ParamsSerialiser | undefined) {
        this._paramsSerialiser = _paramsSerialiser;
    }

    get paramsDeserialiser(): ParamsDeserialiser | undefined {
        return this._paramsDeserialiser;
    }

    get paramsSerialiser(): ParamsSerialiser | undefined {
        return this._paramsSerialiser;
    }

    get history() {
        return this._history;
    }

    get metaData() {
        return this._metaData;
    }
    
    abstract get location(): Location;
}