# V2.0.0-alpha

## Features

- Gesture Navigation is the new feature on the block. It is enabled by default but there is a config option to disable it; you may want to do this for platforms such as iOS since there is no way to disable the native gesture navigation. You could alternatively change the swipe area width config option to capture gesture navigations before the system does but this depends on what the user is used to so be careful. For now gesturing only works from the leftmost part of the screen for back navigation.
- Tranisition Linked Animations have also been added. Use the new ```Motion``` context to subscribe to changes in page transition progress (0-100). Shared Element Transitions are also linked to the page transition and the page transition is also linked to the user gesture progress meaning you can now hold transitions.

## Enhancements

-  Snake case has been removed and refactored in favour of camel case. After consulting [Javascript Standard Style](https://standardjs.com/rules.html) I made sure to change that mistake. Coming from python it was just a force of habit :). This does break code using the older versions of the library hence the major version changing.