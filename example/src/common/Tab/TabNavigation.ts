import { NavigationBase, NavigateEventDetail } from '@react-motion-router/core';
import TabHistory, { BackBehaviour } from './TabHistory';

export default class TabNavigation extends NavigationBase {
    constructor(
        _id: number,
        _disableBrowserRouting: boolean = false,
        _defaultRoute: string | null = null,
        _stack: string[],
        _backBehaviour: BackBehaviour
    ) {
        const _history = new TabHistory(_defaultRoute, _stack, _backBehaviour);

        super(_id, _disableBrowserRouting, _defaultRoute, _history);
    }

    go(delta: number) {
        if (!delta) return;

        // if (this._disableBrowserRouting) {
        //     this._history.implicitPush(route, Boolean(replace));
        // } else {
        //     this._history.push(route, Boolean(replace));
        // }
        (this._history as TabHistory).go(delta);

        if (delta > 0) { // navigate
            const event = new CustomEvent<NavigateEventDetail>('navigate', {
                detail: {
                    id: this.id,
                    route: this._history.current,
                    routeParams: {}
                },
                bubbles: true
            });
    
            if (this._dispatchEvent) this._dispatchEvent(event);
            this._currentParams = {};
        } else { // go back
            let event = new CustomEvent<{replaceState:boolean}>('go-back', {
                detail: {
                    replaceState: false
                }
            });
    
            if (this._dispatchEvent) this._dispatchEvent(event);
        }
    }
    
    get history(): TabHistory {
        return this._history as TabHistory;
    }
}