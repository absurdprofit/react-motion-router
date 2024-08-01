import { Vec2 } from "./common/types";

export class ScrollRestorationData {
    private _map = new Map<string, Vec2>();

    set(key: string, scrollPos: Vec2 = {x: 0, y: 0}) {
        this._map.set(key, scrollPos);
    }

    get(key: string) {
        return this._map.get(key);
    }
}