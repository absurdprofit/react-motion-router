import React from 'react';
import * as Stack from '@react-motion-router/stack';
import { lazy } from '@react-motion-router/core';
import { isIOS, isPWA } from './common/utils';
import { ThemeProvider } from '@mui/material/styles';
import theme from './Theme';
import Navbar from './Components/Navbar';
import "./App.css";
import { STATIC_ANIMATION } from './common/constants';
import { animation, slideToStatic } from './animations';
import { SlidesAnimation } from './Screens/Slides/animations';

const NotFound = lazy(() => import('./Screens/NotFound'));
const Home = lazy(() => import('./Screens/Home'));
const Cards = lazy(() => import('./Screens/Cards'));
const Cards2 = lazy(() => import('./Screens/Cards2'));
const Slides = lazy(() => import('./Screens/Slides'));
const Tiles = lazy(() => import('./Screens/Tiles'));
const Details = lazy(() => import('./Screens/Details'));
const Overlays = lazy(() => import('./Screens/Overlays'));

function Routes() {
  return (
    <Stack.Router config={{
      screenConfig: {
        gestureDisabled: false,
        gestureMinFlingVelocity: 1000,
        animation,
        gestureDirection: "horizontal"
      },
      initialPathname: '.',
      basePath: '/(react-motion-router/)?',
      disableBrowserRouting: isPWA() && isIOS(),
    }}>
      <Stack.Screen
        path='overlays/**'
        component={Overlays}
        fallback={<div className='screen-fallback overlays'></div>}
      />
      <Stack.Screen
        path={'slides'}
        component={Slides}
        defaultParams={{ hero: 0 }}
        fallback={<div className='screen-fallback slides'></div>}
        config={{
          gestureDisabled: true,
          animation: SlidesAnimation,
        }}
      />
      <Stack.Screen
        path={'cards'}
        name="Cards Demo"
        component={Cards}
        config={{
          title: "Cards Demo",
          gestureDirection: "right",
          header: { component: () => <Navbar title="Cards Demo" /> },
          animation: slideToStatic
        }}
        fallback={<div className='screen-fallback cards'></div>}
      />
      <Stack.Screen
        path={'cards-2'}
        name="Cards Demo 2"
        component={Cards2}
        config={{
          title: "Cards Demo 2",
          gestureDirection: "right",
          header: { component: () => <Navbar title="Cards Demo 2" /> },
          animation: slideToStatic
        }}
        fallback={<div className='screen-fallback cards-2'></div>}
      />
      <Stack.Screen
        path={"details"}
        component={Details}
        config={{
          animation: STATIC_ANIMATION,
          gestureDirection: "down",
          gestureAreaWidth: window.innerHeight,
          gestureHysteresis: .3
        }}
        defaultParams={{ data: "Default" }}
        fallback={<div className='screen-fallback details'></div>}
      />
      <Stack.Screen
        path={"."}
        component={Home}
        config={{
          header: { component: () => <Navbar title="React Motion Router" /> }
        }}
        fallback={<div className='screen-fallback home'></div>}
      />
      <Stack.Screen
        path="tiles"
        component={Tiles}
        fallback={<div className='screen-fallback tiles'></div>}
        config={{
          header: { component: () => <Navbar title="Tiles" /> },
          animation: slideToStatic
        }}
      />
      <Stack.Screen
        name="Not Found"
        path="*"
        component={NotFound}
        fallback={<div className='screen-fallback not-found'></div>}
        config={{
          header: { component: () => <Navbar title="Not Found" /> }
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
