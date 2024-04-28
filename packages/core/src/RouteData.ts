import { createContext } from "react";
import { RouteProp } from "./common/types";

export const RoutePropContext = createContext<RouteProp>({
    focused: false,
    config: {},
    params: {},
    path: "*",
    setParams: () => {},
    setConfig: () => {}
});