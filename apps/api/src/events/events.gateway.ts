import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { LiveEventName } from '@camp-dilly/shared';
import type { Server, Socket } from 'socket.io';

/** Broadcast-only invalidation bus, not a data channel: the socket never
 * carries booking amounts, PINs, or anything sensitive — just an event
 * name like "income-day:changed" telling every connected staff device
 * "go refetch via the authenticated REST API". That's what lets the
 * gateway skip auth entirely (nothing here is worth protecting) while the
 * actual data stays behind JwtAuthGuard as normal. Two staff on the
 * dashboard now see each other's bookings land within a second, instead of
 * needing a manual refresh. */
// `path` (the HTTP/WS endpoint Socket.IO actually listens on) defaults to
// `/socket.io` regardless of `namespace` — namespace is a logical channel
// multiplexed *within* that one endpoint, sent inside the handshake, not
// a URL segment. nginx.conf's `/live/` proxy block and the Vite dev
// server's `/live` proxy rule were both written assuming the connection
// itself lived at `/live/...`, which it never did — real traffic went to
// `/socket.io/...`, missed both proxies entirely, and silently failed
// (confirmed via a real browser: the WebSocket connection errors, and
// falls back nowhere since the polling transport hits the same dead
// route). Setting `path` explicitly here is what makes those existing
// proxy rules actually match real traffic.
@Injectable()
@WebSocketGateway({ cors: { origin: true }, namespace: '/live', path: '/live/socket.io' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  broadcast(event: LiveEventName) {
    this.server?.emit(event, { at: new Date().toISOString() });
  }
}
