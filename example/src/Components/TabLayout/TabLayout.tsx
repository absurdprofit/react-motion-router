import { Button } from '@mui/material';
import React from 'react';
import { Navigation, Router, Stack } from 'react-motion-router';
import Tab, { TabProps } from './Tab';
import '../../css/Tabs.css';
import { TabAnimation } from './Animations';

type TabChild = React.ReactElement<TabProps, React.JSXElementConstructor<typeof Tab>>

interface TabLayoutProps {
    children: TabChild | TabChild[];
}

interface TabLayoutState {
    navigation?: Navigation;
    tabHistory: number[];
}

export default class TabLayout extends React.Component<TabLayoutProps, TabLayoutState> {
    state: TabLayoutState = {
        tabHistory: [0]
    }

    pushTab = (pathname: string, index: number) => {
        let {tabHistory} = this.state;
        const lastTabIndex = tabHistory.length - 1;
        if (tabHistory.at(lastTabIndex) === index) {
            return;
        } else if (tabHistory.at(lastTabIndex)! > index) {
            // find the index in the tab history
            const historyIndex = tabHistory.findIndex((tabIndex) => tabIndex === index);
            const goBackIndex = lastTabIndex - historyIndex;
            tabHistory = tabHistory.slice(0, historyIndex);
            
            console.log(goBackIndex);
            this.state.navigation?.goBack();
        } else {
            tabHistory.push(index);
            this.state.navigation?.navigate(pathname, {});
        }

        this.setState({tabHistory});
    }
    render() {
        return (
            <div className="tab-layout">
                <div className="header-layout">
                    {React.Children.map(this.props.children, (tab, index) => {
                        const {name, pathname} = tab.props;
                        return <Button onClick={() => this.pushTab(pathname, index)}>{name}</Button>
                    })}
                </div>
                <Router onMount={(navigation: Navigation) => {
                    this.setState({navigation});
                }}>
                    {React.Children.map(this.props.children, tab => {
                        const {pathname, name} = tab.props;
                        return (
                            <Stack.Screen
                                component={() => tab}
                                path={pathname}
                                name={name}
                                config={{animation: TabAnimation}}
                            />
                        );
                    })}
                </Router>
            </div>
        );
    }
}
