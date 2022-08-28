import React from 'react';
import ScreenBase, { ScreenBaseProps, ScreenBaseState } from '@react-motion-router/core/ScreenBase';

export namespace Stack {

    export interface ScreenProps extends ScreenBaseProps {}
    
    export interface ScreenState extends ScreenBaseState {}
    
    export class Screen extends ScreenBase {}
}
