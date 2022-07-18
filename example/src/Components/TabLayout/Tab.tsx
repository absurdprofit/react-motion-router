import React from 'react';

export interface TabProps {
    name: string;
    index?: number;
    children?: React.ReactNode;
    pathname: string;
}

export default class Tab extends React.Component<TabProps> {
    render(): React.ReactNode {
        const {children} = this.props;
        return (
            <div className="tab">
                {children}
            </div>
        );
    }
}