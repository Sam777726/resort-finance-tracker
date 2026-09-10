import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppConfig } from '../config/configuration';

const REFRESH_PREFIX = 'refresh:';
const RATE_PREFIX = 'rate:';

/** Raw ioredis client for the two things NestJS's cache-manager abstraction
 * doesn't suit: revocable refresh-token storage and atomic rate-limit
 * counters. Connects lazily and never throws on a transient Redis blip —
 * callers (see RedisThrottlerGuard) decide how to degrade if Redis is down,
 * the same "design for absence" approach as the cache layer. */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(config: ConfigService<AppConfig, true>) {
    this.client = new Redis({
      host: config.get('redis.host', { infer: true }),
      port: config.get('redis.port', { infer: true }),
      password: config.get('redis.password', { infer: true }),
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => Math.min(times * 200, 2000),
      lazyConnect: false,
    });
    this.client.on('error', (err) => this.logger.warn(`Redis connection issue: ${err.message}`));
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }

  // ---- refresh tokens (hashed) — keyed by staffId so "logout everywhere"
  // is a single DEL, and a stolen refresh token can be revoked without
  // touching Postgres at all. ----
  async storeRefreshToken(staffId: string, tokenHash: string, ttlSeconds: number) {
    await this.client.set(REFRESH_PREFIX + staffId, tokenHash, 'EX', ttlSeconds);
  }
  async getRefreshTokenHash(staffId: string): Promise<string | null> {
    return this.client.get(REFRESH_PREFIX + staffId);
  }
  async revokeRefreshToken(staffId: string) {
    await this.client.del(REFRESH_PREFIX + staffId);
  }

  // ---- fixed-window rate limiting: INCR + EXPIRE-if-new, the standard
  // Redis counter pattern. Returns the count AFTER this hit. ----
  async hitRateLimit(key: string, windowSeconds: number): Promise<number> {
    const fullKey = RATE_PREFIX + key;
    const count = await this.client.incr(fullKey);
    if (count === 1) {
      await this.client.expire(fullKey, windowSeconds);
    }
    return count;
  }
}
