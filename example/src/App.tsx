import React from 'react';
import {Router, Stack} from 'react-motion-router';
import Home from './Screens/Home';
import Details from './Screens/Details';
import Post from './Screens/Post';
import Tiles from './Screens/Tiles';
import Slides from './Screens/Slides';
import Cards from './Screens/Cards';
import "./css/App.css";

function App() {
  return (
    <div className="App">
      <Router config={{
        default_route: '/',
        page_load_transition: false,
        animation: {
          type: "zoom",
          duration: 200,
        }
      }}>
        <Stack.Screen
          path={'/slides'}
          component={Slides}
          default_params={{hero: 0}}
        />
        <Stack.Screen
          path={'/cards'}
          component={Cards}
        />
        <Stack.Screen
          path={"/details"}
          component={Details}
          default_params={{data: "Default"}}
          
        />
        <Stack.Screen
          path={"/"}
          component={Home}
        />
        <Stack.Screen
          path={"/post"}
          component={Post}
          default_params={{data: "Default"}}
        />
        <Stack.Screen
          path={"/tiles"}
          component={Tiles}
          default_params={{params: "data"}}
        />
      </Router>
    </div>  
  );
}

export default App;
