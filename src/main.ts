import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/http-exception.filter.js';
import { EnvironmentVariables } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe: runs the DTO decorators on EVERY request.
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip any field that has no decorator in the DTO.
      // Sending { "title": "X", "isAdmin": true } -> the service only sees title.
      whitelist: true,
      // Turn the plain JSON into an instance of the DTO class. This is what
      // makes @Type(() => SeatDto) and nested validation work.
      transform: true,
    }),
  );

  // One error format for the whole app: { statusCode, message, path, timestamp }
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger: interactive API docs at http://localhost:3000/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cinema API')
    .setDescription(
      'Films, halls, showings and seat bookings. Data is stored in PostgreSQL.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // PORT comes from .env, already validated (see config/env.validation.ts).
  const config =
    app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  console.log(
    `Cinema API: http://localhost:${port}  |  Swagger: http://localhost:${port}/docs`,
  );
}
await bootstrap();
