import React from 'react';
import {Router, Stack, AnimationConfig} from 'react-motion-router';
import Home from './Screens/Home';
import Details from './Screens/Details';
import Tiles from './Screens/Tiles';
import Slides from './Screens/Slides';
import Cards from './Screens/Cards';
import { getPWADisplayMode, iOS } from './common/utils';
import "./css/App.css";

const isPWA = getPWADisplayMode() === 'standalone';
let animation: AnimationConfig = {
  type: "zoom",
  direction: "in",
  duration: 350,
};

if (iOS() && !isPWA) {
  animation = {
    type: 'none',
    duration: 0
  }
}

function App() {
  return (
    <div className="App">
      <Router config={{
        defaultRoute: '/',
        disableDiscovery: false,
        disableBrowserRouting: isPWA && iOS(),
        animation: animation
      }}>
        <Stack.Screen
          path={'/slides'}
          component={Slides}
          defaultParams={{hero: 0}}
        />
        <Stack.Screen
          path={'/cards'}
          component={Cards}
        />
        <Stack.Screen
          path={"/details"}
          component={Details}
          defaultParams={{data: "Default"}}
        />
        <Stack.Screen
          path={"/"}
          component={Home}
        />
        <Stack.Screen
          path={"/tiles"}
          component={Tiles}
          defaultParams={{params: "data"}}
        />
      </Router>
    </div>  
  );
}

export default App;
