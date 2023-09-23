import { createContext } from "react";
import { PlainObject, RouteProp } from "./common/types";
import { ScreenBaseProps } from "./ScreenBase";

export const RouteDataContext = createContext<RouteProp<ScreenBaseProps, PlainObject>>({
    preloaded: false,
    config: {},
    params: {},
    path: undefined,
    setParams: () => {},
    setConfig: () => {}
});