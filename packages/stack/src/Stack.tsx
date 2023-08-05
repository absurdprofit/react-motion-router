import { ScreenBase } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import Navigation from './Navigation';

export namespace Stack {
    export interface ScreenComponentProps<T extends { [key: string]: any; } = {}> extends ScreenComponentBaseProps<T, Navigation> {}

    type Presentation = "default" | "dialog";
    interface ScreenProps extends ScreenBaseProps {
        config?: ScreenBaseProps["config"] & {
            presentation?: Presentation;
        }
    }
    
    interface ScreenState extends ScreenBaseState {}
    
    export class Screen extends ScreenBase<ScreenProps, ScreenState> {}
}
