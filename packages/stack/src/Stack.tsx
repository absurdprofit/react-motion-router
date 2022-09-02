import React from 'react';
import { ScreenBase } from '@react-motion-router/core';
import type { ScreenBaseProps, ScreenBaseState } from '@react-motion-router/core';

export namespace Stack {

    export interface ScreenProps extends ScreenBaseProps {}
    
    export interface ScreenState extends ScreenBaseState {}
    
    export class Screen extends ScreenBase {}
}
