
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('index.tsx loaded');

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (!window.location.hostname.includes('ai.studio')) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.debug('SW registration info: ', err);
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target container 'root' not found");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);