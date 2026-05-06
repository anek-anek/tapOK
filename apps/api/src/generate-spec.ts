import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

import { GenerateAppModule } from './generate-app.module';

async function generate() {
  const app = await NestFactory.create(GenerateAppModule);

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = resolve(__dirname, '..', '..', '..', 'packages', 'api', 'openapi.json');
  mkdirSync(resolve(__dirname, '..', '..', '..', 'packages', 'api'), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI spec written to ${outputPath}`);
  await app.close();
}

generate().catch((err) => {
  console.error('generate-spec failed:', err);
  process.exit(1);
});
