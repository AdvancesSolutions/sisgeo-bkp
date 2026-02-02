import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false }));

  const uploadDir = config.get('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });
  const corsOrigin = config.get<string>('CORS_ORIGIN');
  const origin = corsOrigin
    ? corsOrigin.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  app.enableCors({
    origin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix('');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const doc = new DocumentBuilder()
    .setTitle('SIGEO API')
    .setDescription('Gestão Operacional')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, doc);
  SwaggerModule.setup('api-docs', app, document);

  const port = config.get('PORT') ?? 3000;
  await app.listen(port);
  console.log(`SIGEO API running at http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api-docs`);
}
bootstrap();
