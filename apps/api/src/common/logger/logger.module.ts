import { Module } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonUtilities } from 'nest-winston';
import * as winston from 'winston';

/** Structured logging: JSON in production (so it's ingestible by any log
 * aggregator — CloudWatch, Loki, ELK), readable colorized text locally. */
@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format:
            process.env.NODE_ENV === 'production'
              ? winston.format.combine(winston.format.timestamp(), winston.format.json())
              : winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.ms(),
                  nestWinstonUtilities.format.nestLike('CampDilly', { prettyPrint: true, colors: true }),
                ),
        }),
      ],
    }),
  ],
})
export class LoggerModule {}
