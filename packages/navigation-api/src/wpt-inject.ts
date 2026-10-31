import { createNavigationFacade } from './polyfill';

const navigation = createNavigationFacade({
  initialUrl: window.location.href,
  storageKey: `@react-motion-router/navigation-api/wpt${window.location.pathname}`,
});

Object.defineProperty(window, 'navigation', {
  configurable: true,
  value: navigation,
});

if (Reflect.get(window, 'navigation') !== navigation) {
  throw new Error('WPT could not install the navigation facade on window.navigation.');
}
