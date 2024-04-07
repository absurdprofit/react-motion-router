import { createContext } from "react";
import { RouteData } from "./common/types";

export const RouteDataContext = createContext<RouteData | null>(null);