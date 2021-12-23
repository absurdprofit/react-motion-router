# React Motion Router

Declarative routing library for React ⚛ with page transitions and animations. Under Development 🧪. Based on React Router and React Navigation.

#### [Demo](https://router.nxtetechnologies.com)

## Installation

```
npm install react-motion-router
```

## Usage

#### Basic

Use the `Router` component to place your screens. Pass a component to the component prop of `Stack.Screen` component to be rendered when navigated to.

```
...
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
            <Stack.Screen path="/" component={Home} />
        </div>
    ):
}

...
```

#### Navigation

Navigation is done through the navigation object exposed on your screen's props.

```
...
function Home(props) {
    return(
        <div>
            ...
            <button
                onClick={() => {
                    props.navigation.navigate('/posts');
                }}>Posts</button>
            ...
        </div>
    );
}
...
```

#### Passing Parameters to Other Screens

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
...
<h1>{props.route.params.post.title}</h1>
...
```

All data passed to the navigate function is accessible on the target screen through the route prop.

#### Default Parameters

A default parameter can be passed to the screen by passing a value to the default_params prop on `Stack.Screen` component.

```
...
<Stack.Screen path="/posts" component={Posts} default_params={{
    post: {
        title: "Default Title"
    }
}}/>
...
```

#### Transitions

Transitions are a feature baked into react-motion-router; hence the name... To transition between pages do:

```
<Router config={{
    animation: {
        type: "slide",
        direction: "right",
        duration: 300
    }
}}>
...
</Router>
```

#### Shared Element Transition

To do a shared element transition wrap the component you would like shared between screens and supply it with a unique ID prop.

```
// Screen: HOME
...
<SharedElement id="post">
    <h1>Post</h1>
</SharedElement>
...
```

and on another screen:

```
Screen: POSTS
...
<SharedElement id="post">
    <h1>Post</h1>
</SharedElement>
...
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

This way the X and Y axis are animated independently and can alter the path of the shared element while transitioning.

## API Documentation

#### Router Config

Config object used to modify the behaviour of the Router.
| Property | Type | Description |
| ------ | ------ | ------ |
| default_route | string | If the user navigates directly to a route other than the default and navigate.back() is called the app will navigate to the default route instead of closing. |
| page_load_transition | boolean | Set to false if you wish to disable page transitions when the application first loads. |
| animation | AnimationConfig | Config object used to modify the router's transition behaviour. |

#### Animation Config

Config object used to modify the router's transition behaviour.
| Property | Type | Description |
| ------ | ------ | ------ |
| type | "slide" or "fade" | The animation type used for page transitions. |
| duration | number | The time in milliseconds for how long page transitions are from start to end. |
| direction | "left", "right", "up" or "down" | The direction used for slide transitions. The direction is swapped automatically on back navigation. i.e. The user presses their browser back button or navigation.back() is called. |

#### Shared Element Transitions

| Property | Type                | Description                                                         |
| -------- | ------------------- | ------------------------------------------------------------------- |
| id       | string or number    | The unique ID used to keep track of the element in the scene.       |
| children | React.ReactChild    | A single React element which will be displayed between transitions. |
| config   | SharedElementConfig | Config object used to alter the behaviour of the shared element.    |

#### SharedElementConfig

| Property         | Type                  | Description                                                                                                                                                                                     |
| ---------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transform_origin | TransformOrigin       | Changes transform alignment of shared element.                                                                                                                                                  |
| duration         | number                | The time in milliseconds for how long the shared element transition is from start to end                                                                                                        |
| easing_function  | CSS <easing-function> | denotes a mathematical function that describes the rate at which a numerical value changes.<sup>[1](denotes a mathematical function that describes the rate at which a numerical value changes. |

)</sup> |
