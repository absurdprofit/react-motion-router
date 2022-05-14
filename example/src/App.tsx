import React from 'react';
import {Router, Stack, AnimationConfig} from 'react-motion-router';
import { matchRoute } from 'react-motion-router/common/utils';
import { getPWADisplayMode, iOS } from './common/utils';
import "./css/App.css";
import VideoTest from './Screens/VideoTest';
import VideoTest2 from './Screens/VideoTest2';

const NotFound = React.lazy(() => import('./Screens/NotFound'));
const Home = React.lazy(() => import('./Screens/Home'));
const Cards = React.lazy(() => import('./Screens/Cards'));
const Cards2 = React.lazy(() => import('./Screens/Cards2'));
const Slides = React.lazy(() => import('./Screens/Slides'));
const Tiles = React.lazy(() => import('./Screens/Tiles'));
const Details = React.lazy(() => import('./Screens/Details'));

function DetailsFallback({route}: any) {
  const {hero} = route.params;
  return (
    <div className='screen-fallback details'>
      <img
        src={hero.photo.url}
        alt="profile-details"
        width={hero.photo.width}
        height={hero.photo.height}
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: 'auto'
        }}
      />
    </div>
  );
}

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
      <Router config={{
        defaultRoute: '/',
        disableDiscovery: false,
        disableBrowserRouting: isPWA && iOS(),
        animation: animation,
        minFlingVelocity: 1000
      }}>
        <Stack.Screen
          path={'/slides'}
          component={Slides}
          defaultParams={{hero: 0}}
          fallback={<div className='screen-fallback slides'></div>}
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
          fallback={<div className='screen-fallback cards'></div>}
        />
        <Stack.Screen
          path={'/cards-2'}
          component={Cards2}
          fallback={<div className='screen-fallback cards-2'></div>}
        />
        <Stack.Screen
          path={"/details"}
          component={Details}
          defaultParams={{data: "Default"}}
          fallback={<DetailsFallback />}
        />
        <Stack.Screen
          path={"/"}
          component={Home}
          fallback={<div className='screen-fallback home'></div>}
        />
        <Stack.Screen
          path={"/video"}
          component={VideoTest2}
          fallback={<div className='screen-fallback home'></div>}
        />
        <Stack.Screen
          path={"/video-test"}
          component={VideoTest}
          fallback={<div className='screen-fallback home'></div>}
        />
        <Stack.Screen
          path={/^\/tiles/}
          component={Tiles}
          defaultParams={{params: "data"}}
          fallback={<div className='screen-fallback tiles'></div>}
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
        <Stack.Screen component={NotFound} fallback={<div className='screen-fallback not-found'></div>} />
      </Router>
  );
}

export default App;
