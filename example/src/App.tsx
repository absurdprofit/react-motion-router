import React, {Suspense} from 'react';
import {Router, Stack, AnimationConfig} from 'react-motion-router';
import { matchRoute } from 'react-motion-router/common/utils';
import Home from './Screens/Home';
import Details from './Screens/Details';
import Tiles from './Screens/Tiles';
import Slides from './Screens/Slides';
import NotFound from './Screens/NotFound';
import { getPWADisplayMode, iOS } from './common/utils';
import "./css/App.css";

const Cards = React.lazy(() => import('./Screens/Cards'));

const isPWA = getPWADisplayMode() === 'standalone';
let animation: AnimationConfig = {
  type: "slide",
  direction: "right",
  duration: 350,
};

let fadeAnimation: AnimationConfig = {
  type: "fade",
  duration: 350
}

if (iOS() && !isPWA) {
  animation = {
    type: 'none',
    duration: 0
  }
  fadeAnimation = {
    type: "none",
    duration: 0
  }
}

function App() {
  return (
    <Suspense fallback={<div className='cards-demo-loading'></div>}>
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
          config={{
            animation: (currentPath, nextPath) => {
              if (matchRoute(currentPath, "/slides") && matchRoute(nextPath, "/")) {
                return animation;
              }
              return fadeAnimation;
            }
          }} 
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
          path={/^\/tiles/}
          component={Tiles}
          defaultParams={{params: "data"}}
          config={{
            animation: (currentPath, nextPath) => {
              if ((matchRoute(currentPath, "/tiles") && matchRoute(nextPath, "/slides"))
              || (matchRoute(currentPath, "/slides") && matchRoute(nextPath, "/tiles"))) {
                return fadeAnimation;
              }
              return animation;
            }
          }}
        />
        <Stack.Screen component={NotFound} />
      </Router>
    </Suspense>  
  );
}

export default App;
