import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
process.env.TZ = 'UTC';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';

let app: INestApplication;
let bootstrapPromise: Promise<void> | null = null;

function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}

import compression from 'compression';
import { json, urlencoded } from 'express';

async function bootstrap() {
  app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  app.use(compression());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:4200';
  const origins = webOrigin.split(',').map((o) => o.trim());

  if (process.env.NODE_ENV === 'production') {
    if (!origins.includes('https://tapok.app')) {
      origins.push('https://tapok.app');
    }
    if (!origins.includes('https://www.tapok.app')) {
      origins.push('https://www.tapok.app');
    }
  }

  // CORS must be registered before BetterAuth so preflight requests on /api/auth/* are handled correctly
  app.enableCors({ origin: origins, credentials: true });

  // BetterAuth owns all /api/auth/* routes — bypass NestJS guards/pipes entirely.
  // We use a root-level middleware instead of app.use('/api/auth', ...) to preserve 
  // the full URL path, which BetterAuth needs to correctly match routes against its baseURL.
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/auth')) {
      return toNodeHandler(auth)(req, res);
    }
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe — strips unknown fields, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const document = buildOpenApiDocument(app);

    SwaggerModule.setup('openapi', app, document, {
      jsonDocumentUrl: '/openapi.json',
      yamlDocumentUrl: '/openapi.yaml',
    });

    const { apiReference } = await import('@scalar/nestjs-api-reference');
    app.use(
      '/docs',
      apiReference({
        url: '/openapi.json',
        theme: 'default',
      }),
    );
  }

  await app.init();

  const port = process.env.PORT ?? 3000;
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(port);
    const logger = new Logger('Bootstrap');
    logger.log(`API running at http://localhost:${port}`);
    logger.log(`Scalar docs  → http://localhost:${port}/docs`);
    logger.log(`Swagger UI   → http://localhost:${port}/openapi`);
    logger.log(`OpenAPI JSON → http://localhost:${port}/openapi.json`);
  }
}

if (process.env.NODE_ENV !== 'production') {
  bootstrap().catch((err) => {
    console.error('Bootstrap failed', err);
    process.exit(1);
  });
}

export default async (req: any, res: any) => {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap();
  }
  await bootstrapPromise;
  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
};
