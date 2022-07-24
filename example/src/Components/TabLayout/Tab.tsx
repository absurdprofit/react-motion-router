import React from 'react';
import {Stack} from 'react-motion-router';

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
    export interface TabProps extends Stack.ScreenProps {
        path: string;
    }

    export class Screen extends Stack.Screen<TabProps> {}
}

export default Tab;