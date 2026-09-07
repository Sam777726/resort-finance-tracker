import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RedisService } from '../../redis/redis.service';

export const THROTTLE_KEY = 'throttle';
export interface ThrottleOptions { limit: number; windowSeconds: number }
/** e.g. @Throttle({ limit: 5, windowSeconds: 60 }) — 5 requests/minute/IP. */
export const Throttle = (opts: ThrottleOptions) => SetMetadata(THROTTLE_KEY, opts);

/** Hand-rolled Redis fixed-window rate limiter rather than pulling in a
 * throttling package: it's a five-line pattern (INCR + EXPIRE-if-new) and
 * writing it directly means there's no black box between "why did this
 * 429" and the Redis key backing it. Applied to /auth/login, where a
 * 4-6 digit PIN makes brute-forcing a real (if narrow) concern.
 *
 * Fails OPEN if Redis is unreachable — a rate limiter that takes down
 * login during a Redis blip is a worse outcome than a temporarily
 * unthrottled endpoint. */
@Injectable()
export class RedisThrottlerGuard implements CanActivate {
  private readonly logger = new Logger(RedisThrottlerGuard.name);

  constructor(private readonly reflector: Reflector, private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.get<ThrottleOptions>(THROTTLE_KEY, context.getHandler());
    if (!opts) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const key = `${req.route?.path ?? req.path}:${req.ip}`;

    try {
      const count = await this.redis.hitRateLimit(key, opts.windowSeconds);
      if (count > opts.limit) {
        throw new HttpException('Too many attempts — try again in a moment.', HttpStatus.TOO_MANY_REQUESTS);
      }
      return true;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.warn(`Rate limiter degraded (Redis unavailable?): ${(err as Error).message}`);
      return true; // fail open
    }
  }
}
