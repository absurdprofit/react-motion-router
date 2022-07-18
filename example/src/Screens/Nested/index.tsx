import React from 'react';
import TabLayout, { Tab } from '../../Components/TabLayout';
import '../../css/Nested.css';

export default class Nested extends React.Component {

    render() {
        return (
            <TabLayout>
                <Tab name="Tab 1" pathname='/'>
                    <div style={{backgroundColor: 'red', height: '100%'}}>
                        <h1>Tab 1</h1>
                    </div>
                </Tab>
                <Tab name="Tab 2" pathname='/tab-2'>
                    <div style={{backgroundColor: 'blue', height: '100%'}}>
                        <h1>Tab 2</h1>
                    </div>
                </Tab>
                <Tab name="Tab 3" pathname='/tab-3'>
                    <div style={{backgroundColor: 'yellow', height: '100%'}}>
                        <h1>Tab 3</h1>
                    </div>
                </Tab>
            </TabLayout>
        );
    }
}