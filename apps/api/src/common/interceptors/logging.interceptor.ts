import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const who = req.user?.id ? ` by ${req.user.id}` : '';
        this.logger.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)${who}`);
      }),
    );
  }
}
