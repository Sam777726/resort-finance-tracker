import { io } from 'socket.io-client';

// Connects to the API's /live namespace (proxied by Vite in dev, see
// vite.config.ts). Deliberately unauthenticated — see events.gateway.ts on
// the API for why that's safe here (it's an invalidation signal, not a
// data channel). Created once and shared app-wide.
export const liveSocket = io('/live', {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling'],
});
