import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import configuration, { type AppConfig } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { EventsModule } from './events/events.module';
import { LoggerModule } from './common/logger/logger.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { SettingsModule } from './settings/settings.module';
import { IncomeDayModule } from './income-day/income-day.module';
import { IncomeOvernightModule } from './income-overnight/income-overnight.module';
import { StoreModule } from './store/store.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        connection: { host: config.get('redis.host', { infer: true }), port: config.get('redis.port', { infer: true }) },
      }),
      inject: [ConfigService],
    }),
    LoggerModule,
    PrismaModule,
    RedisModule,
    EventsModule,
    AuthModule,
    StaffModule,
    SettingsModule,
    IncomeDayModule,
    IncomeOvernightModule,
    StoreModule,
    ExpensesModule,
    ReportsModule,
    JobsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Auth is opt-out, not opt-in: every route requires a valid JWT unless
    // its controller/handler is explicitly outside these guards (auth's own
    // /login, /setup, /refresh, /staff live on AuthController, which has no
    // guard applied). Safer default for a financial app than remembering to
    // decorate every new sensitive endpoint by hand.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
