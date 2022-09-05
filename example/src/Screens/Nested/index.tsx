import Theme from '../../common/Tab/Theme';
import React from 'react';
import TabLayout, { Tab, TabAnimation } from '../../Components/TabLayout';
import '../../css/Nested.css';

const Tab1 = () => (
    <div className='tab' style={{backgroundColor: Theme[0]}}>
        <article>
            <h2>Sit dolor</h2>
            <p>Lorem ipsum dolor sit amet consectet adipisicing elit</p>
            <h2>Lore sf</h2>
            <p>Lorem ipsum dolor sit amet consectet adipisicing elit</p>
            <p>Sit molestiae itaque rem optio molestias voluptati obcaecati!</p>
            <p>Ipsum, a? Tenetur aut a nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
            <p>nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
            <p>Sit molestiae itaque rem optio molestias voluptati obcaecati!</p>
            <p>Ipsum, a? Tenetur aut a nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
            <p>nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
          </article>
    </div>
);

const Tab2 = () => (
    <div className='tab' style={{backgroundColor: Theme[1]}}>
        <article>
            <h2>Tenetur</h2>
            <p>Lorem ipsum dolor sit amet consectet adipisicing elit. Sit molestiae itaque rem optio molestias voluptati obcaecati!</p>
            <h2>Tenet urs</h2>
            <p>Ipsum, a? Tenetur aut a nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
            <p>nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
            <h2>Lore s sdf</h2>
            <p>Lorem ipsum dolor sit amet consectet adipisicing elit</p>
            <p>Sit molestiae itaque rem optio molestias voluptati obcaecati!</p>
            <p>Ipsum, a? Tenetur aut a nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
            <p>nisi, aspernatur earum eligendi id quam nihil sint quas?</p>
          </article>
    </div>
);

const Tab3 = () => (
    <div className='tab' style={{backgroundColor: Theme[2]}}>
        <article>
            <h2>Lorems dolor</h2>
            <p>Lorem ipsum dolor sit amet consectet adipisicing elit</p>
            <p>Sit molestiae itaque rem optio molestias voluptati obcaecati!</p>
            <p>nisi, aspernatur earum eligendi id quam nihil sint quas?</p><ul>
              <li>Lorem</li>
              <li>ipsum</li>
              <li>dolor</li>
            </ul>
            <p>Sit molestiae itaque rem optio molestias voluptati obcaecati!</p>
          </article>
    </div>
);

export default class Nested extends React.Component {

    render() {
        return (
            <TabLayout>
                <Tab.Screen name="Tab 1" path='/' component={Tab1} config={{animation: TabAnimation}}  />
                <Tab.Screen name="Tab 2" path='/tab-2' component={Tab2} config={{animation: TabAnimation}} />
                <Tab.Screen name="Tab 3 Longer" path='/tab-3' component={Tab3} config={{animation: TabAnimation}} />
            </TabLayout>
        );
    }
}