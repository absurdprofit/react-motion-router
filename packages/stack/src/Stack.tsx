import React from 'react';
import { ScreenBase } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState, ScreenComponentBaseProps } from '@react-motion-router/core';
import Navigation from './Navigation';

export namespace Stack {
    export interface ScreenComponentProps<T extends { [key: string]: any; } = {}> extends ScreenComponentBaseProps<T, Navigation> {}

    interface ScreenProps extends ScreenBaseProps {}
    
    interface ScreenState extends ScreenBaseState {}
    
    export class Screen extends ScreenBase<ScreenProps, ScreenState> {}
}
