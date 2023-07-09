import React from "react";
import { PlainObject, RouteProp } from "./common/types";

export const RouteDataContext = React.createContext<RouteProp<PlainObject>>({
    preloaded: false,
    params: {},
    path: undefined
});