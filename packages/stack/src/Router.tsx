import React from 'react';
import { RouterBase } from '@react-motion-router/core';
import type { RouterBaseProps, RouterBaseState } from '@react-motion-router/core';

export interface RouterProps extends RouterBaseProps {}

export interface RouterState extends RouterBaseState {}

export default class Router extends RouterBase {}