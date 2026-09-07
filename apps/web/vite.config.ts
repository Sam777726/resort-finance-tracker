import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
