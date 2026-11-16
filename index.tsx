import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { initBotId } from 'botid/client/core';

// Vercel BotID: adds an invisible bot check to the AI and shop search calls,
// verified on the server in api/_botid.ts. Skipped in development.
initBotId({
  protect: [
    { path: '/api/ai', method: 'POST' },
    { path: '/api/places', method: 'GET' },
  ],
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Pages are pre-rendered to static HTML at build time (scripts/prerender.mjs).
// When that HTML is present, attach to it instead of re-rendering from scratch.
if (rootElement.firstElementChild) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}
