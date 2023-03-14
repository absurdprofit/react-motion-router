import {HistoryBase} from '@react-motion-router/core';

export type BackBehaviour = 'history' | 'none' | 'first';

export default class TabHistory extends HistoryBase {
    private _index: number = 0;
    private _backBevhiour: BackBehaviour;

    constructor(_routerId: number, _defaultRoute: string | null, _baseURL: URL, _stack: string[] = [], _backBehaviour: BackBehaviour = 'none') {
        super(_routerId, _defaultRoute, _baseURL);

        const pathname = window.location.pathname.replace(_baseURL.pathname, '');
        this._index = _stack.findIndex((stackEntry) => stackEntry === `/${pathname}`);
        this._index = this._index < 0 ? 0 : this._index;

        this._stack = _stack;
        this._backBevhiour = _backBehaviour;
    }
    
    go(delta: number) {
        this._index = this._index + delta;
        const url = this.baseURL.href + this._stack[this._index];
        this.replaceState({stack: this._stack, routerId: this._routerId}, "", url);
    }
    
    set stack(_stack: string[]) {
        this._stack = _stack;
    }

    get next() {
        return this._stack[this._index + 1] || null;
    }

    get current() {
        return this._stack[this._index] || window.location.pathname;
    }

    get previous() {
        return this._stack[this._index - 1] || null;
    }

    get index() {
        return this._index;
    }
}