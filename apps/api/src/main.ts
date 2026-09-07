import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService<AppConfig, true>);

  app.use(helmet());
  app.enableCors({ origin: config.get('webOrigin', { infer: true }), credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // ...and reject the request if it sent any
      transform: true, // turn query-string values into real numbers/booleans per DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Camp Dilly Ledger API')
    .setDescription('Income & expenditure API for Camp Dilly resort — bearer JWT auth, Redis-cached reads, WebSocket change notifications.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get('port', { infer: true });
  await app.listen(port);
  app.get(WINSTON_MODULE_NEST_PROVIDER).log(`Camp Dilly API listening on :${port} (docs at /docs)`, 'Bootstrap');
}

bootstrap();
