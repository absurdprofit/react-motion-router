import { createContext } from "react";
import { RoutePropBase } from "./common/types";

export const RoutePropContext = createContext<RoutePropBase>(null!);