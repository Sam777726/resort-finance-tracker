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
@Injectable()
@WebSocketGateway({ cors: { origin: true }, namespace: '/live' })
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
