import React from 'react';
import {ScreenBase, ScreenBaseProps} from '@react-motion-router/core';

// export default class Tab extends React.Component<TabProps> {
    //     render(): React.ReactNode {
        //         const {children} = this.props;
        //         return (
            //             <div className="tab">
//                 {children}
//             </div>
//         );
//     }

namespace Tab {
    export interface TabProps extends ScreenBaseProps {
        path: string;
    }

    export class Screen extends ScreenBase<TabProps> {}
}

export default Tab;