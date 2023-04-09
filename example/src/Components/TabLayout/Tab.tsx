import React from 'react';
import {ScreenBase, ScreenBaseProps} from '@react-motion-router/core';

namespace Tab {
    export interface TabProps extends ScreenBaseProps {
        path: string;
    }

    export class Screen extends ScreenBase<TabProps> {}
}

export default Tab;