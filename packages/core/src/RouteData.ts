import { createContext } from "react";
import { PlainObject, RouteProp } from "./common/types";

export const RouteDataContext = createContext<RouteProp<PlainObject>>({
    preloaded: false,
    params: {},
    path: undefined,
    setParams: () => {}
});