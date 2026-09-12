import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new deploy shouldn't need reception to manually clear their
      // phone's cache — the service worker checks for an update on every
      // page load and swaps in the new one automatically.
      registerType: 'autoUpdate',
      includeAssets: ['icon-source.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Camp Dilly Ledger',
        short_name: 'Camp Dilly',
        description: 'Income, expense, and booking ledger for Camp Dilly resort',
        start_url: '/',
        display: 'standalone',
        background_color: '#F6F2E7',
        theme_color: '#3F6B3F',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app is useless without a live connection to the API anyway
        // (every screen is real-time financial data) — this service
        // worker exists purely to satisfy Chrome's installability
        // requirement and auto-update the app shell, not to provide an
        // offline mode. NetworkFirst on navigations means a phone with a
        // spotty connection still gets the latest shell when possible
        // without a hard failure when it can't.
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'app-shell' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Point straight at the shared package's TS source instead of its
      // compiled dist/ output. Rollup's CJS-named-export detection doesn't
      // reliably see through tsc's CommonJS emit for a locally re-exported
      // package in this setup (confirmed: even a plain `exports.X = value`
      // re-assignment wasn't picked up) — aliasing to source sidesteps CJS
      // interop entirely, since esbuild/Rollup then compile it as native
      // TS/ESM like any other first-party file. The NestJS API is
      // unaffected: it still consumes the compiled dist/ via plain
      // Node `require()`, which has no such ambiguity.
      '@camp-dilly/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          query: ['@tanstack/react-query', 'axios', 'socket.io-client'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // REST + Swagger docs
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      // Socket.IO live-update channel
      '/live': { target: 'http://localhost:4000', ws: true, changeOrigin: true },
    },
  },
});
