import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Thin wrapper so Prisma's connection lifecycle is managed by Nest's DI
 * container instead of a module-level singleton — makes it mockable in
 * tests and guarantees a clean disconnect on shutdown. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to Postgres');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
