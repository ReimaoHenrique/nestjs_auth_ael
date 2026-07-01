import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let app;

export default async function handler(req, res) {
  if (!app) {
    const { AppModule } = require('../dist/src/app.module');

    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(),
    );

    const config = new DocumentBuilder()
      .setTitle('API de Autenticacao - AEL')
      .setDescription('Autenticacao com JWT, refresh token, Prisma e Argon2id.')
      .setVersion('2.0.2')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    app.enableCors({ origin: true });

    await app.init();
  }

  const instance = app.getHttpAdapter().getInstance();
  instance(req, res);
}
