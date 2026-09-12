import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import { queryClient } from './lib/queryClient';
import { App } from './App';
import './index.css';

// Required for Chrome to offer "Install app" at all — a registered
// service worker is one of the installability criteria alongside the
// manifest. autoUpdate (configured in vite.config.ts) means this also
// silently activates a new version on the next load, no manual refresh.
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
