# [V2.2.0-alpha](https://github.com/nxtexe/react-motion-router/blob/main/CHANGELOG.md#v220-alpha)
## Features
- Added AnimationConfigFactory to ```Stack.Screen``` animation config prop. This is a function that returns an AnimationConfig object whose parameters are the pathname for the now outgoing element and the pathname for the now incoming element. Now you can dyanically create animations based on the outgoing pathname and the incoming pathname. E.g.
```
        <Stack.Screen
          path={"/tiles"}
          component={Tiles}
          config={{
            animation: (currentPath, nextPath) => {
              if (currentPath === "/tiles" && nextPath === "/slides") {
                return {
                    type: 'fade',
                    duration: 350
                };
              }
              return { // Also in and out animations can be set independently
                  in: {
                      type: 'slide',
                        direction: 'right',
                        duration: 350
                  },
                  out: {
                      type: 'fade',
                      duration: 200
                  }
              };
            }
          }}
        />
```

# [V2.1.0-alpha](https://github.com/nxtexe/react-motion-router/blob/main/CHANGELOG.md#v210-alpha)
## Features
- Option to enable memory routing meaning instead of relying on the ```popstate``` event and the browser ```window.location``` routing is done completely in memory. One thing to note is that ```window.location.pathname``` will always be ```'/'``` so it is better to just check location on the navigator prop passed to your screen. Essentially it's just ```window.location``` with pathname being filled in from memory.


# [V2.0.0-alpha](https://github.com/nxtexe/react-motion-router/blob/main/CHANGELOG.md#v200-alpha)

## Features

- Gesture Navigation is the new feature on the block. It is enabled by default but there is a config option to disable it; you may want to do this for platforms such as iOS since there is no way to disable the native gesture navigation. You could alternatively change the swipe area width config option to capture gesture navigations before the system does but this depends on what the user is used to so be careful. For now gesturing only works from the leftmost part of the screen for back navigation.
- Tranisition Linked Animations have also been added. Use the new ```Motion``` context to subscribe to changes in page transition progress (0-100). Shared Element Transitions are also linked to the page transition and the page transition is also linked to the user gesture progress meaning you can now hold transitions.

## Enhancements

-  Snake case has been removed and refactored in favour of camel case. After consulting [Javascript Standard Style](https://standardjs.com/rules.html) I made sure to change that mistake. Coming from python it was just a force of habit :). This does break code using the older versions of the library hence the major version changing.
- The official logo has been added to the repo 🤩.
- Added fade, fade-through, cross-fade transition types to SharedElement.
- Switched from CSSTransitionGroup to WAAPI