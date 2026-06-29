import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppServer } from './app.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await new AppServer(app).run();
}

bootstrap();
