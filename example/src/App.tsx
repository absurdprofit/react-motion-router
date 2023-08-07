import React from 'react';
import {Router, Stack } from '@react-motion-router/stack';
import {
  matchRoute,
  AnimationKeyframeEffectConfig,
  AnimationConfig,
  AnimationConfigFactory,
  lazy
} from '@react-motion-router/core';
import { STATIC_ANIMATION, iOS, isPWA } from './common/utils';
import { OverlaysAnimation } from './Screens/Overlays/Animations';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import Navbar from './Components/Navbar';
import "./css/App.css";

const NotFound = lazy(() => import('./Screens/NotFound'));
const Home = lazy(() => import('./Screens/Home'));
const Cards = lazy(() => import('./Screens/Cards'));
const Cards2 = lazy(() => import('./Screens/Cards2'));
const Slides = lazy(() => import('./Screens/Slides'));
const Tiles = lazy(() => import('./Screens/Tiles'));
const Details = lazy(() => import('./Screens/Details'));
const Overlays = lazy(() => import('./Screens/Overlays'));
const Video = lazy(() => import('./Screens/Video'));
const FullscreenVideo = lazy(() => import('./Screens/FullscreenVideo'));

let animation: AnimationConfig = {
  type: "slide",
  direction: "right",
  duration: 350,
};

let fadeAnimation: AnimationConfig = {
  type: "fade",
  duration: 350
}

if (iOS() && !isPWA()) {
  animation = {
    type: 'none',
    duration: 0
  }
  fadeAnimation = {
    type: "none",
    duration: 0
  }
}

const cardsToDetails: AnimationConfigFactory = (currentPath, nextPath) => {
  if (
    matchRoute(nextPath, '/details')
    || matchRoute(currentPath, '/details')
  ) {
    return STATIC_ANIMATION;
  }
  return animation;
}

function Routes() {
  return (
      <Router config={{
        basePathname: '/index.html',
        defaultRoute: '/',
        disableDiscovery: false,
        disableBrowserRouting: isPWA() && iOS(),
        animation: animation,
        minFlingVelocity: 1000
      }}>
        <Stack.Screen
          path='/overlays/**'
          name="Overlays"
          component={Overlays}
          fallback={<div className='screen-fallback overlays'></div>}
          config={{
            keepAlive: true,
            animation: OverlaysAnimation
          }}
        />
        <Stack.Screen
          path={'/slides'}
          name="Slides"
          component={Slides}
          defaultParams={{hero: 0}}
          fallback={<div className='screen-fallback slides'></div>}
          config={{
            disableDiscovery: true,
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
          name="Cards Demo"
          component={Cards}
          config={{
            header: {component: () => <Navbar title="Cards Demo" />},
            animation: cardsToDetails
          }}
          fallback={<div className='screen-fallback cards'></div>}
        />
        <Stack.Screen
          path={'/cards-2'}
          name="Cards Demo 2"
          component={Cards2}
          config={{
            header: {component: () => <Navbar title="Cards Demo 2" />},
            animation: cardsToDetails
          }}
          fallback={<div className='screen-fallback cards-2'></div>}
        />
        <Stack.Screen
          path={"/details"}
          name="Details"
          component={Details}
          config={{
            animation: STATIC_ANIMATION,
            swipeDirection: "down",
            swipeAreaWidth: window.innerHeight,
            hysteresis: .3
          }}
          defaultParams={{data: "Default"}}
          fallback={<div className='screen-fallback details'></div>}
        />
        <Stack.Screen
          path={"/"}
          name='Home'
          component={Home}
          config={{
            header: {component: () => <Navbar title="React Motion Router" />}
          }}
          fallback={<div className='screen-fallback home'></div>}
        />
        <Stack.Screen
          path="/tiles"
          name="Tiles"
          component={Tiles}
          fallback={<div className='screen-fallback tiles'></div>}
          config={{
            header: {component: () => <Navbar title="Tiles" />},
            animation: (currentPath, nextPath) => {
              if ((matchRoute(currentPath, "/tiles") && matchRoute(nextPath, "/slides"))
              || (matchRoute(currentPath, "/slides") && matchRoute(nextPath, "/tiles"))) {
                return fadeAnimation;
              }
              return animation;
            }
          }}
        />
        <Stack.Screen path="/video" component={Video} />
        <Stack.Screen path="/fullscreen-video" component={FullscreenVideo} />
        <Stack.Screen
          name="Not Found"
          component={NotFound}
          fallback={<div className='screen-fallback not-found'></div>}
          config={{
            header: {component: () => <Navbar title="Not Found" />}
          }}
        />
      </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Routes />
    </ThemeProvider>
  );
}

export default App;
