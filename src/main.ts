import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';

async function bootstrap() {
  config()
  const app = await NestFactory.create(AppModule);
  app.useLogger(['log', 'error', 'warn', 'debug']);
  await app.listen(3000);
}
bootstrap();
