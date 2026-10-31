# @react-motion-router/navigation-api

An app-managed Navigation API facade for environments without the browser Navigation API.

The package uses the browser-native `window.navigation` when available. Otherwise, it
loads a separate virtual-navigation implementation on demand. The fallback keeps its
own same-origin route entries in memory and backs them up to `localStorage`; it does not
use or modify the History API.

## Usage

```ts
import { getNavigationApi } from '@react-motion-router/navigation-api';

const navigation = await getNavigationApi();
const result = navigation.navigate('/details/42', {
  history: 'push',
  state: { source: 'list' },
});
await result.finished;
```

The app renders routes by intercepting virtual navigations:

```ts
navigation.onnavigate = event => {
  event.intercept({
    handler: () => renderRoute(event.destination.url),
  });
};
```

`getNavigationApi()` returns the native API without loading the fallback when the
browser provides it. If native support is missing, it asynchronously loads and creates
a virtual facade. To create a facade directly (for example, in tests), use
`createNavigationFacade()`.

The facade owns a **virtual navigation state**. Its `navigate`, `back`, `forward`,
`traverseTo`, `entries`, and state methods operate on its in-memory stack and persisted
backup. They do not update the address bar, trigger document loads, or connect to the
browser's Back/Forward buttons. `navigate` only accepts same-origin URLs. State saved
to `localStorage` must be JSON-serializable. Use a distinct `storageKey` when multiple
independent navigation stacks share an origin.

The facade emits app-level `navigate`, `currententrychange`, `navigatesuccess`, and
`navigateerror` events. These are synthetic events; browser navigation gestures and
other code that directly uses `window.navigation` do not participate in this facade.