<p align="center">
    <img src="logo.png" />
</p>

<h1 align="center">
    React Motion Router
</h1>

Declarative routing library for React ⚛ with 60FPS page transitions and animations 🚀. Out of the box support for Shared Element Transitions 🤩. Under Development 🧪. Based on React Router and React Navigation.

#### [Demo](https://router.nxtetechnologies.com)

# [![version](https://img.shields.io/npm/v/react-motion-router)](https://www.npmjs.com/package/react-motion-router) [![downloads](https://img.shields.io/npm/dm/react-motion-router)](https://www.npmjs.com/package/react-motion-router) [![license](https://img.shields.io/npm/l/react-motion-router)](https://github.com/nxtexe/react-motion-router/blob/main/LICENSE)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Basic](#basic)
  - [Navigation](#navigation)
  - [Passing Params](#passing-parameters-to-other-screens)
  - [Default Params](#default-parameters)
  - [Transitions](#transitions)
  - [Shared Element Transition](#shared-element-transition)
- [API Documentation](#api-documentation)
  - [Stack.Screen](#stackscreen)
  - [Stack.Screen Config](#stackscreen-config)
  - [Router Config](#router-config)
  - [AnimationConfig](#animationconfig)
  - [SharedElement](#sharedelement)
  - [SharedElement Config](#sharedelement-config)
- [Remarks](#remarks)
- [Credits](#credits)

## Installation

```
npm install react-motion-router
```

## Usage

#### Basic

Use the `Router` component to render your screens. Pass a React component to the component prop of `Stack.Screen` to be rendered when the path prop of the screen has been navigated to.

```
// ...
import {Router, Stack} from 'react-motion-router';

function Home() {
    return(
        <div className="Home">
            <h1>Hello World</h1>
        </div>
    );
}
function App() {
    return(
        <div className="app">
            <Router>
                <Stack.Screen path="/" component={Home} />
            </Router>
        </div>
    ):
}

// ...
```

You can also pass lazy loaded components to the screen along with an optional fallback component to be rendered while your component loads.

```
// ...
const Home = React.lazy(() => import('./Screens/Home'));
<Router>
    <Stack.Screen path="/" component={Home} fallback={<div className='screen-fallback home'></div>}>
</Router>
// ...
```

If a fallback component is provided the fallback component is animated in just like the actual component would and is even able to do gesture navigation all while your screen is loaded in asynchronously.

#### Navigation

Navigation is done through the navigation object exposed on your screen's props.

```
// ...
function Home(props) {
    return(
        <div>
            // ...
            <button onClick={() => {
                props.navigation.goBack();
            }}>BACK</button>
            <button
                onClick={() => {
                    props.navigation.navigate('/posts');
                }}>Posts</button>
            // ...
        </div>
    );
}
// ...
```

The navigation object also exposes information such as `navigation.location`. It's the same as `window.location` but it will always be up to date and correct regardless of if browser routing has been disabled.

#### Passing Parameters to Screens

To pass data to the next screen, pass a value to the navigate function.

```
props.navigation.navigate('/posts', {
    post: {
        title: "Post"
    }
});
```

To access this data on the next screen:

```
// Screen: POSTS
// ...
<h1>{props.route.params.post.title}</h1>
// ...
```

All data passed to the navigate function is accessible on the target screen through the route prop.

Parameters can also be parsed from URL parameters for example a pathname with a search part such as `/slides?hero=0` will be parsed into an object with key `hero` and value `0`. To customise this behaviour you can pass a custom deserialiser or serialiser function to the `Router` component which will be used to convert between URL parameters and React Motion Router parameters and vice-versa.

```
<Router
    config={{
        paramsSerialiser: (params) => {
            const searchPart = new URLSearchParams(params).toString()

            return btoa(searchPart); // search encoded as Base64 string
        },
        paramsDeserialiser: (b64SearchPart) => {
            const searchPart = atob(b64SearchPart.slice(1)); // start after the ?
            const searchParams = new URLSearchParams(searchPart);

            const params = {};
            for (let [key, value] of searchParams) {
                params[key] = value;
            }

            return params;
        }
    }}
>
// ...
</Router>
```

In this example `/slides?hero=0` becomes `/slides?aGVybz0w`.

#### Default Parameters

A default parameter can be passed to the screen by passing a value to the defaultParams prop on `Stack.Screen` component.

```
// ...
<Stack.Screen path="/posts" component={Posts} defaultParams={{
    post: {
        title: "Default Title"
    }
}}/>
// ...
```

#### Transitions

Transitions are a feature baked into react-motion-router; hence the name... To transition between screens do:

```
<Router config={{
    animation: {
        type: "slide",
        direction: "right",
        duration: 300
    }
}}>
// ...
</Router>
```

You can subscribe to the transition progress by using the motion consumer component.

```
import {Motion} from 'react-motion-router';

// ...
<Motion.Consumer>
    {(progress) => {
        return (
            <div>{progress}</div>
        );
    }}
</Motion.Consumer>

// OR Class.contextType

static contextType = Motion;
```

The progress is updated as the animation plays and can be used to interpolate DOM style attributes or control playback of an animation.

#### Shared Element Transition

To do a shared element transition wrap the component you would like shared between screens and supply it with a unique ID prop.

```
// Screen: HOME
// ...
<SharedElement id="post">
    <h1>Post</h1>
</SharedElement>
// ...
```

and on another screen:

```
Screen: POSTS
// ...
<SharedElement id="post">
    <h1>Post</h1>
</SharedElement>
// ...
```

That's it! The element will transition from one screen to the next seemlessly. They can even do layered animations.

```
<SharedELement id="post" config={{
    x: {
        duration: 100
    },
    y: {
        duration: 300
    }
}}>
    <h1>Post</h1>
</SharedElement>
```

This way the X and Y axis are animated independently and can alter the path of the shared element while transitioning. Note that these durations are clamped to the overall router transition duration.

## API Documentation

#### Stack.Screen

| Prop          | Type                  | Description                                                                             |
| ------------- | --------------------- | --------------------------------------------------------------------------------------- |
| path          | string                | Pathname of the screen.                                                                 |
| component     | JSXElementConstructor | A valid React Component or React lazy loaded Component to be rendered.                  |
| fallback      | ReactNode             | A valid React Node to be rendered while the real component is suspended (lazy loading). |
| defaultParams | Object                | A dictionary of parameters that can be accessed by the rendered component.              |
| config        | Object                | A dictionary of options to alter the behaviour of the screen.                           |

#### Stack.Screen Config

| Property  | Type                                      | Description                                                                                                                                                                                            |
| --------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| animation | AnimationConfig or AnimationConfigFactory | AnimationConfig object or function that returns an AnimationConfig object. This config object is used to modify the router's transition behaviour. In and out animation can also be set independently. |

#### Router Config

| Property              | Type            | Description                                                                                                                                                                 |
| --------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultRoute          | string          | If the user navigates directly to a route other than the default and navigate.goBack() is called the app will navigate to the default route instead of leaving the website. |
| disableDiscovery      | boolean         | Option to disable gesture navigation.                                                                                                                                       |
| disableBrowserRouting | boolean         | Option to avoid updating browser native history stack and rely completely on memory routing.                                                                                |
| animation             | AnimationConfig | Config object used to modify the router's global transition behaviour. In and out animation can also be set independently.                                                  |
| swipeAreaWidth        | number          | Area in pixels from the left edge of the screen that gesture navigation can be triggered from.                                                                              |
| hysteresis            | number          | Percent from 0-100 which specifies minimum gesture progress before navigation is triggered.                                                                                 |
| minFlingVelocity      | number          | Minimum average velocity of swipe gesture before navigation is triggered even if hysteresis was not reached.                                                                |
| paramsDeserialiser    | Function        | A function that takes a URL search part string as input and outputs a valid JavaScript object.                                                                              |
| paramsSerialiser      | Function        | A function that takes a valid JavaScript object as input and outputs a URL search part string.                                                                              |

#### AnimationConfig

| Property  | Type                                         | Description                                                                                                                                                                            |
| --------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type      | "slide", "fade", "zoom" or "none"            | The animation type used for page transitions.                                                                                                                                          |
| duration  | number                                       | The time in milliseconds for how long page transitions are from start to end.                                                                                                          |
| direction | "left", "right", "up", "down", "in" or "out" | The direction used for slide transitions. The direction is swapped automatically on back navigation. i.e. The user presses their browser back button or navigation.goBack() is called. |

#### SharedElement

| Prop     | Type             | Description                                                                                                                |
| -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| id       | string or number | The unique ID used to keep track of the element in the scene. The IDs must match in each screen for a transition to occur. |
| children | React.ReactChild | A single React element which will be displayed between transitions.                                                        |
| config   | Object           | Config object used to alter the behaviour of the shared element.                                                           |

#### SharedElement Config

| Property        | Type                                            | Description                                                                                                                                                                 |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type            | "morph", "fade", "fade-through" or "cross-fade" | Type of transition.                                                                                                                                                         |
| transformOrigin | TransformOrigin                                 | Changes transform alignment of shared element.                                                                                                                              |
| duration        | number                                          | The time in milliseconds for how long the shared element transition is from start to end                                                                                    |
| easingFunction  | CSS &lt;easing-function&gt;                     | Denotes a mathematical function that describes the rate at which a numerical value changes.<sup>[1](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)</sup> |

It is useful to note that the duration and easing function properties can also be set on the X and Y axis as independent values by specifying an X or Y property on the shared element config object.

```
// ...
config={{
    x: {
        easingFunction: "ease-in-out",
        duration: 500
    }
}}
// ...
```

## Remarks

This is a work in progress and elements of this solution are subject to change.
There are a few limitations to be aware of for example there is:

- no analogue for HashRouter in this solution
- no nested routing although there are plans to add this eventually.

## Credits

Shoutout to [@IzjerenHein](https://github.com/IjzerenHein) whose [react-native-shared-element](https://github.com/IjzerenHein/react-native-shared-element) was a source of great inspiration for this project 🙏.

#### Other Relevant Resources

1. [material.io](https://material.io/design/motion/the-motion-system.html)
2. [react-native-magic-move](https://github.com/IjzerenHein/react-native-magic-move)
3. [Hein Rutjes React Europe Talk](https://www.youtube.com/watch?v=Uj7aWfrtey8&list=FLsxiG7-SUK8s8xReSGAH4lQ)
4. [Shared Element Transitions for Web](https://medium.com/@prateekbh/shared-elements-transitions-for-web-6fa9d31d4d6a)
