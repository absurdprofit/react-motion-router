import React from 'react';
import {Router, Stack} from './Navigation';
import Home from './Screens/Home';
import Details from './Screens/Details';
import Post from './Screens/Post';
import Tiles from './Screens/Tiles';
import "./css/App.css";

function App() {
  return (
    <div className="App">
      <Router config={{
        animation: {
          type: "fade",
          duration: 1000,
        }
      }}>
        
        <Stack.Screen
          path={"/details"}
          component={Details}
          default_params={{data: "Default"}}
          shared_elements={(props) => {
            return [props.route.params.profile?.id];
          }}
        />
        <Stack.Screen
          path={"/"}
          component={Home}
        />
        <Stack.Screen
          path={"/post"}
          component={Post}
          default_params={{data: "Default"}}
          shared_elements={(props) => {
            return [props.route.params.post?.id];
          }}
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
