import React from 'react';
import TabLayout, { Tab } from '../../Components/TabLayout';
import '../../css/Nested.css';

const Tab1 = () => (
    <div style={{backgroundColor: 'red', height: '100%'}}>
        <h1>Tab 1</h1>
    </div>
);

const Tab2 = () => (
    <div style={{backgroundColor: 'blue', height: '100%'}}>
        <h1>Tab 2</h1>
    </div>
);

const Tab3 = () => (
    <div style={{backgroundColor: 'green', height: '100%'}}>
        <h1>Tab 3</h1>
    </div>
);

export default class Nested extends React.Component {

    render() {
        return (
            <TabLayout>
                <Tab.Screen name="Tab 1" path='/' component={Tab1}  />
                <Tab.Screen name="Tab 2" path='/tab-2' component={Tab2} />
                <Tab.Screen name="Tab 3 Longer" path='/tab-3' component={Tab3} />
            </TabLayout>
        );
    }
}