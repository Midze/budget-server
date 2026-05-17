import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { config } from 'dotenv';

async function bootstrap() {
  config()
  const app = await NestFactory.create(AppModule);
  const defaultCorsOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://204.168.217.228',
  ];
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultCorsOrigins;

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));
  app.useLogger(['log', 'error', 'warn', 'debug']);
  await app.listen(3000);
}
bootstrap();
