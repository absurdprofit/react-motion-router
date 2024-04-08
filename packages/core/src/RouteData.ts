import { createContext } from "react";
import { RouteData } from "./common/types";

export const RouteDataContext = createContext<RouteData>({
    focused: false,
    config: {},
    params: {},
    path: "*",
    setParams: () => {},
    setConfig: () => {}
});