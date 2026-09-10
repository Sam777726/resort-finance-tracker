import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { RedisService } from './redis.service';
import type { AppConfig } from '../config/configuration';

/** Two Redis surfaces on purpose:
 *  - RedisService wraps a raw ioredis client for things cache-manager
 *    doesn't fit well: atomic INCR-based rate limiting, and refresh-token
 *    storage with manual TTL/deletion (revocable "logout everywhere").
 *  - Nest's CacheModule (registered here too) backs the @Inject(CACHE_MANAGER)
 *    cache-aside pattern used by SettingsService/ReportsService.
 * Both point at the same Redis instance; splitting the API is about using
 * the right abstraction for each job, not running two caches.
 *
 * Global for the same reason PrismaModule and EventsModule are: it's
 * cross-cutting infrastructure that most feature modules need (auth,
 * staff, rate limiting, settings/reports caching), so requiring every one
 * of them to import it individually would just be DI boilerplate. */
@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService<AppConfig, true>) => ({
        store: await redisStore({
          host: config.get('redis.host', { infer: true }),
          port: config.get('redis.port', { infer: true }),
          password: config.get('redis.password', { infer: true }),
        }),
        ttl: 60_000, // default 60s; individual callers override per key
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
})
export class RedisModule {}
