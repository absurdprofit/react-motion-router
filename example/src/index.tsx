import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { isNavigationSupported, isURLPatternSupported, polyfillNavigation, polyfillURLPattern } from "@react-motion-router/core";

if (!isNavigationSupported())
  await polyfillNavigation();

if (!isURLPatternSupported())
  await polyfillURLPattern();

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
