import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

/** Used by docker-compose's healthcheck and would back a k8s readiness
 * probe in a real deployment — checks the two things this API actually
 * depends on to function, not just "is the process alive". @Public()
 * because Docker's healthcheck (and any external monitor) has no JWT to
 * present — this bit Docker's own healthcheck in exactly this repo before
 * the decorator was added: the global JwtAuthGuard was 401ing it. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  @Public()
  @Get()
  async check() {
    const [db, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.client.ping(),
    ]);

    const status = {
      database: db.status === 'fulfilled' ? 'up' : 'down',
      redis: redis.status === 'fulfilled' ? 'up' : 'down',
    };

    const healthy = status.database === 'up' && status.redis === 'up';
    if (!healthy) {
      throw new HttpException({ status, ok: false }, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { ok: true, ...status, time: new Date().toISOString() };
  }
}
