import { createContext } from "react";
import { PlainObject, RouteProp } from "./common/types";
import { ScreenBaseProps } from "./ScreenBase";

export const RouteDataContext = createContext<RouteProp<ScreenBaseProps["config"], PlainObject>>({
    focused: false,
    preloaded: false,
    config: {},
    params: {},
    path: undefined,
    setParams: () => {},
    setConfig: () => {}
});