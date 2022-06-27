import React from 'react';
import { Anchor, Router, Stack } from 'react-motion-router';
import Tab from './Tab';
import '../../css/Nested.css';

const Tab1 = () => <Tab title="Tab 1" />;
const Tab2 = () => <Tab title="Tab 2"><Anchor href='/' goBack /></Tab>;

export default class Nested extends React.Component {
    render() {
        return (
            <div className="tabs-nav">
                <Anchor href='/'>Tab 1</Anchor>
                <Anchor href='/tab-2'>Tab 2</Anchor>
                <Router config={{defaultRoute: '/tabs-2', animation: {type: 'none', duration: 0}}}>
                    <Stack.Screen component={Tab1} name='Tab 1' path='/' />
                    <Stack.Screen component={Tab2} name='Tab 2' path='/tab-2' />
                </Router>
            </div>
        );
    }
}