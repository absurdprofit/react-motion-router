import { createContext } from "react";
import ScreenBase from "./ScreenBase";

export default class ScreenData {
    private screen: ScreenBase;
    constructor(screen: ScreenBase) {
        this.screen = screen;
    }

    get resolvedPathname() {
        return this.screen.resolvedPathname;
    }
}

export const ScreenDataContext = createContext<ScreenData | undefined>(undefined);