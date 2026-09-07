import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { Request, Response } from 'express';

/** Turns every thrown error — HttpException or not — into the same
 * { statusCode, message, path, timestamp } JSON shape, and logs 5xx at
 * error level (with stack) vs 4xx at warn level (expected client mistakes,
 * no need to page anyone over a bad PIN attempt). */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttp ? exception.getResponse() : null;
    const message =
      typeof body === 'string'
        ? body
        : (body as { message?: string | string[] })?.message ?? (exception as Error)?.message ?? 'Internal server error';

    const payload = {
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} -> ${status}`, (exception as Error)?.stack);
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status}: ${JSON.stringify(message)}`);
    }

    response.status(status).json(payload);
  }
}
