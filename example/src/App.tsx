import React from 'react';
import {Router, Stack} from 'react-motion-router';
import Home from './Screens/Home';
import Details from './Screens/Details';
import Post from './Screens/Post';
import Tiles from './Screens/Tiles';
import "./css/App.css";

function App() {
  return (
    <div className="App">
      <Router config={{
        page_load_transition: true,
        animation: {
          type: "fade",
          duration: 500,
        }
      }}>
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
        />
      </Router>
    </div>  
  );
}

export default App;
