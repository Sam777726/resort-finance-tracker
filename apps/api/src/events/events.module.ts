import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

/** Global: every feature module that mutates data (income-day, expenses,
 * settings, ...) injects EventsGateway to broadcast after a write, without
 * each one importing this module individually. */
@Global()
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
