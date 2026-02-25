// ============================================
// main.ts — Server Entry Point
// ============================================

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// Swagger = auto-generates beautiful API documentation page
// Like: Laravel Scribe or L5-Swagger
// Client can test ALL APIs from browser — no Postman needed

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // All routes start with /api
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ============================================
  // Swagger API Documentation
  // Accessible at: http://your-domain:4000/api/docs
  // ============================================
  const config = new DocumentBuilder()
    .setTitle('SEO Audit Tool API')                          // Page title
    .setDescription('Comprehensive SEO Audit Platform API')  // Description
    .setVersion('1.0')                                        // API version
    .addBearerAuth()                                          // Adds JWT auth button
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // Now accessible at: /api/docs

  await app.listen(4000, '0.0.0.0');
  console.log('Server running on http://localhost:4000');
  console.log('API docs: http://localhost:4000/api/docs');
}
bootstrap();