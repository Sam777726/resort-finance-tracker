import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { LIVE_EVENTS } from '@camp-dilly/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { SETTINGS_DEFAULTS, SETTINGS_KEYS } from './defaults';

const CACHE_KEY = 'settings:bundle';
const CACHE_TTL_MS = 5 * 60 * 1000; // settings change rarely; explicit invalidation on write keeps this safe

/** Textbook cache-aside: reads try Redis first and only fall through to
 * Postgres on a miss (or a cold/unreachable cache — see the try/catch),
 * repopulating the cache before returning. Writes update Postgres then
 * actively evict the cache key rather than trying to keep it in sync
 * in-place, which is the simpler and safer half of cache-aside to get
 * right. A WebSocket broadcast tells connected clients their local copy
 * is now stale too. */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly events: EventsGateway,
  ) {}

  async getBundle(): Promise<Record<string, unknown>> {
    try {
      const cached = await this.cache.get<Record<string, unknown>>(CACHE_KEY);
      if (cached) return cached;
    } catch (err) {
      this.logger.warn(`Cache read failed, falling back to Postgres: ${(err as Error).message}`);
    }

    const bundle = await this.loadFromDb();

    try {
      await this.cache.set(CACHE_KEY, bundle, CACHE_TTL_MS);
    } catch (err) {
      this.logger.warn(`Cache write failed (non-fatal): ${(err as Error).message}`);
    }
    return bundle;
  }

  async updateKey(key: string, value: unknown): Promise<{ key: string; value: unknown }> {
    if (!SETTINGS_KEYS.includes(key)) throw new BadRequestException(`Unknown settings key "${key}"`);

    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: value as object },
      update: { value: value as object },
    });

    try {
      await this.cache.del(CACHE_KEY);
    } catch (err) {
      this.logger.warn(`Cache invalidation failed (non-fatal, TTL will still expire it): ${(err as Error).message}`);
    }

    this.events.broadcast(LIVE_EVENTS.SETTINGS_CHANGED);
    return { key, value };
  }

  /** Seeds a key with its default the first time it's read, never
   * overwriting a value an admin already customised. */
  private async loadFromDb(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.setting.findMany();
    const byKey = new Map<string, unknown>(rows.map((r) => [r.key, r.value]));

    const missing = SETTINGS_KEYS.filter((k) => !byKey.has(k));
    if (missing.length > 0) {
      await this.prisma.$transaction(
        missing.map((key) =>
          this.prisma.setting.upsert({
            where: { key },
            create: { key, value: SETTINGS_DEFAULTS[key] as object },
            update: {},
          }),
        ),
      );
      missing.forEach((k) => byKey.set(k, SETTINGS_DEFAULTS[k]));
    }

    return Object.fromEntries(SETTINGS_KEYS.map((k) => [k, byKey.get(k)]));
  }
}
