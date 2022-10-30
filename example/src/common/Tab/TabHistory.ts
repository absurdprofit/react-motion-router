import {HistoryBase} from '@react-motion-router/core';

export type BackBehaviour = 'history' | 'none' | 'first';

export default class TabHistory extends HistoryBase {
    private _index: number = 0;
    private _backBevhiour: BackBehaviour;

    constructor(_defaultRoute: string | null, _baseURL?: URL, _stack: string[] = [], _backBehaviour: BackBehaviour = 'none') {
        super(_defaultRoute, _baseURL);

        this._stack = _stack;
        this._backBevhiour = _backBehaviour;
    }
    
    go(delta: number) {
        this._index = this._index + delta;
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