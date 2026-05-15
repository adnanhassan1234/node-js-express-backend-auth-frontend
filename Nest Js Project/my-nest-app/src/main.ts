import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
// import { ThrottlerExceptionFilter } from './throttler/throttler.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useGlobalFilters(new ThrottlerExceptionFilter());
  app.use(express.static(join(__dirname, '..', 'public')));
  //swagger impliment
  const config = new DocumentBuilder()
    .setTitle('Mongodb Database')
    .setDescription('The Nest API description')
    .setVersion('1.0')
    .addTag('Nest Js')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });

  // enable cors
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  app.enableShutdownHooks();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
