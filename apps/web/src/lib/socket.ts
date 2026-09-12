import { io } from 'socket.io-client';

// Connects to the API's /live namespace, at the explicit /live/socket.io
// path (proxied by Vite in dev and by nginx in the containerized/prod
// build — both proxy rules match on the /live prefix, which only lines
// up with real traffic if the client and server agree on that as the
// actual transport path, not just the namespace — see the matching
// comment on events.gateway.ts for the full story). Deliberately
// unauthenticated — see events.gateway.ts on the API for why that's safe
// here (it's an invalidation signal, not a data channel). Created once
// and shared app-wide.
export const liveSocket = io('/live', {
  path: '/live/socket.io',
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling'],
});
