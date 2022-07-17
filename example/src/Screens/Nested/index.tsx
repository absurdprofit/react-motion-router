import React from 'react';
import { Anchor, Navigation, Router, Stack } from 'react-motion-router';
import Tab from './Tab';
import '../../css/Nested.css';

const Tab1 = () => <Tab title="Tab 1"></Tab>;
const Tab2 = () => <Tab title="Tab 2"></Tab>;

interface NestedState {
    navigation?: Navigation;
}

export default class Nested extends React.Component<any, NestedState> {
    state: NestedState = {}

    pushTab = (tabRoute: string) => {
        if (!this.state.navigation) return;

    }
    render() {
        const {navigation} = this.state;

        return (
            <div className="tabs-nav">
                <div className="header-layout">
                    <button onClick={() => navigation?.navigate('/', {}, true)}>Tab 1</button>
                    <button onClick={() => navigation?.navigate('/tab-2', {}, true)}>Tab 2</button>
                </div>
                <Router onMount={(navigation: Navigation) => {
                    this.setState({navigation});
                }} config={{animation: {type: 'none', duration: 0}}}>
                    <Stack.Screen component={Tab1} name='Tab 1' path='/' />
                    <Stack.Screen component={Tab2} name='Tab 2' path='/tab-2' />
                </Router>
            </div>
        );
    }
}