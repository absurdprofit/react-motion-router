import React from 'react';

interface TabProps {
    title: string;
    children?: React.ReactNode;
}

export default class Tab extends React.Component<TabProps> {
    render(): React.ReactNode {
        const {title, children} = this.props;
        return (
            <div className="tab">
                <h2>{title}</h2>
                {children}
            </div>
        );
    }
}