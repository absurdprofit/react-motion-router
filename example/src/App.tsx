import React from 'react';
import {Router, Stack } from '@react-motion-router/stack';
import {
  matchRoute,
  AnimationKeyframeEffectConfig,
  AnimationConfig,
  AnimationConfigFactory,
  lazy
} from '@react-motion-router/core';
import { iOS, isPWA } from './common/utils';
import { ModalAnimation, OverlaysAnimation } from './Screens/Overlays/Animations';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import "./css/App.css";

const NotFound = lazy(() => import('./Screens/NotFound'));
const Home = lazy(() => import('./Screens/Home'));
const Cards = lazy(() => import('./Screens/Cards'));
const Cards2 = lazy(() => import('./Screens/Cards2'));
const Slides = lazy(() => import('./Screens/Slides'));
const Tiles = lazy(() => import('./Screens/Tiles'));
const Details = lazy(() => import('./Screens/Details'));
const ModalExample = lazy(() => import('./Screens/Modal'));
const Overlays = lazy(() => import('./Screens/Overlays'));

function DetailsFallback({route}: any) {
  const {hero} = route.params;
  if (!hero) {
    return <></>;
  }
  return (
    <div className='screen-fallback details'>
      <img
        src={hero.photoUrl}
        alt="profile-details"
        width={hero.photoWidth}
        height={hero.photoHeight}
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: 'auto'
        }}
      />
    </div>
  );
}


let animation: AnimationConfig = {
  type: "slide",
  direction: "right",
  duration: 350,
};

let fadeAnimation: AnimationConfig = {
  type: "fade",
  duration: 350
}

let staticAnimation: AnimationKeyframeEffectConfig | AnimationConfig = {
  keyframes: [],
  options: {
    duration: 350
  }
};



if (iOS() && !isPWA()) {
  animation = {
    type: 'none',
    duration: 0
  }
  fadeAnimation = {
    type: "none",
    duration: 0
  }
  staticAnimation = {
    type: "none",
    duration: 0
  }
}

const cardsToDetails: AnimationConfigFactory = (currentPath, nextPath) => {
  if (
    matchRoute(nextPath, '/details')
    || matchRoute(currentPath, '/details')
  ) {
    return staticAnimation;
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
          path='/overlays'
          name="Overlays"
          component={Overlays}
          fallback={<div className='screen-fallback overlays'></div>}
          config={{
            keepAlive: true,
            animation: OverlaysAnimation
          }}
        />
        {/* <Stack.Screen
          path='/modal'
          name="Modal"
          component={ModalExample}
          fallback={<div className='screen-fallback modal'></div>}
          config={{
            swipeDirection: 'down',
            swipeAreaWidth: window.innerHeight / 1.5,
            animation: ModalAnimation,
            disableDiscovery: false,
            hysteresis: 15
          }}
        /> */}
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
            animation: cardsToDetails
          }}
          fallback={<div className='screen-fallback cards'></div>}
        />
        <Stack.Screen
          path={'/cards-2'}
          name="Cards Demo 2"
          component={Cards2}
          config={{
            animation: cardsToDetails
          }}
          fallback={<div className='screen-fallback cards-2'></div>}
        />
        <Stack.Screen
          path={"/details"}
          name="Details"
          component={Details}
          config={{
            animation: staticAnimation,
            swipeDirection: "down",
            swipeAreaWidth: window.innerHeight,
            hysteresis: .3
          }}
          defaultParams={{data: "Default"}}
          fallback={<DetailsFallback />}
        />
        <Stack.Screen
          path={"/"}
          name='Home'
          component={Home}
          fallback={<div className='screen-fallback home'></div>}
        />
        <Stack.Screen
          path="/tiles"
          name="Tiles"
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
        <Stack.Screen name="Not Found" component={NotFound} fallback={<div className='screen-fallback not-found'></div>} />
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
