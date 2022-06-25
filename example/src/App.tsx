import React from 'react';
import {Router, Stack, AnimationConfig, AnimationConfigFactory} from 'react-motion-router';
import { AnimationKeyframeEffectConfig } from 'react-motion-router/common/types';
import { matchRoute } from 'react-motion-router/common/utils';
import { iOS, isPWA } from './common/utils';
import { ModalAnimation } from './Screens/Modal/Animations';
import { OverlaysAnimation } from './Screens/Overlays/Animations';
import "./css/App.css";
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import Nested from './Screens/Nested';

const NotFound = React.lazy(() => import('./Screens/NotFound'));
const Home = React.lazy(() => import('./Screens/Home'));
const Cards = React.lazy(() => import('./Screens/Cards'));
const Cards2 = React.lazy(() => import('./Screens/Cards2'));
const Slides = React.lazy(() => import('./Screens/Slides'));
const Tiles = React.lazy(() => import('./Screens/Tiles'));
const Details = React.lazy(() => import('./Screens/Details'));
const ModalExample = React.lazy(() => import('./Screens/Modal'));
const Overlays = React.lazy(() => import('./Screens/Overlays'));

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
        <Stack.Screen
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
            animation: staticAnimation
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
          path={/^\/tiles?[0-9]?/}
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
        <Stack.Screen component={Nested} path='/nested' />
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
