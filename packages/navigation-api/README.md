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
browser's Back/Forward buttons. The facade intercepts eligible same-origin link clicks
and form submissions in the current document, including programmatic
`HTMLFormElement.submit()` calls, preventing their native navigation and turning them
into `navigate` events. GET form fields become query parameters; POST submissions
expose their `FormData` on the event. Cross-origin links, downloads,
modified clicks, and links or forms targeting another browsing context remain native.
`navigate` only accepts same-origin URLs. State saved to `localStorage` must be
JSON-serializable. Use a distinct `storageKey` when multiple independent navigation
stacks share an origin.

The facade emits app-level `navigate`, `currententrychange`, `navigatesuccess`, and
`navigateerror` events. These are synthetic events; browser Back/Forward gestures,
and direct `location` assignments do not participate in this facade. Call `dispose()`
on a directly created facade when it should stop intercepting document events and
restore the native form submission method.

## Web Platform Tests

The WPT tests are tracked as a shallow, sparse Git submodule at `wpt/`. Run
`npm run test:wpt` from this package to build a single-file test bootstrap and run the
Navigation API suite with WPT's `--inject-script` support. It uses the installed
Playwright Chromium binary and a Chromium host resolver rule, so it does not require
editing the system hosts file. The bootstrap exposes a fresh facade as
`window.navigation`; eligible same-origin anchor and form navigations are intercepted
by the facade, but browser history and document lifecycle behavior are not emulated.
To run selected WPT URL prefixes, set `WPT_INCLUDE` to a comma-separated list (for
example, `WPT_INCLUDE=navigation-api/navigate-event/navigate-form.html npm run test:wpt`).
WPT's runner may set up its Python virtual environment and download ChromeDriver on
the first run.