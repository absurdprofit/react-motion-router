import React from 'react';
import * as Stack from '@react-motion-router/stack';
import { lazy } from '@react-motion-router/core';
import { iOS, isPWA } from './common/utils';
import { OverlaysAnimation } from './Screens/Overlays/Animations';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import Navbar from './Components/Navbar';
import CardsAnimation from './Screens/Cards/animations';
import Cards2Animation from './Screens/Cards2/animations';
import SlidesAnimation from './Screens/Slides/animations';
import TilesAnimation from './Screens/Tiles/animations';
import AppAnimation from './animations';
import "./App.css";
import { STATIC_ANIMATION } from './common/constants';

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

function Routes() {
  return (
      <Stack.Router config={{
        basePathname: '/index.html',
        defaultRoute: '/',
        disableDiscovery: false,
        disableBrowserRouting: isPWA() && iOS(),
        animation: !(iOS() && !isPWA) ? AppAnimation : STATIC_ANIMATION,
        minFlingVelocity: 1000
      }}>
        <Stack.Screen
          path='/overlays/**'
          name="Overlays"
          component={Overlays}
          fallback={<div className='screen-fallback overlays'></div>}
          config={{
            animation: !(iOS() && !isPWA) ? OverlaysAnimation : STATIC_ANIMATION,
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
            animation: !(iOS() && !isPWA) ?  SlidesAnimation : STATIC_ANIMATION,
          }} 
        />
        <Stack.Screen
          path={'/cards'}
          name="Cards Demo"
          component={Cards}
          config={{
            header: {component: () => <Navbar title="Cards Demo" />},
            animation: !(iOS() && !isPWA) ? CardsAnimation : STATIC_ANIMATION,
          }}
          fallback={<div className='screen-fallback cards'></div>}
        />
        <Stack.Screen
          path={'/cards-2'}
          name="Cards Demo 2"
          component={Cards2}
          config={{
            header: {component: () => <Navbar title="Cards Demo 2" />},
            animation: !(iOS() && !isPWA) ? Cards2Animation : STATIC_ANIMATION,
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
            animation: !(iOS() && !isPWA) ? TilesAnimation : STATIC_ANIMATION,
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
      </Stack.Router>
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
