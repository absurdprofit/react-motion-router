import { createContext } from 'react';
import { ScreenBase } from './ScreenBase';
import { RouterBase } from './RouterBase';

export const NestedRouterContext = createContext<{parentRouter: RouterBase, parentScreen: ScreenBase} | null>(null);
export const RouterContext = createContext<RouterBase>(null!);