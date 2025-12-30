import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { corsConfig } from './configs/cors.config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors(corsConfig);
    // --- 스웨거 설정 시작 ---
    const config = new DocumentBuilder()
      .setTitle('JikguMate API')
      .setDescription('직구메이트 팀 프로젝트를 위한 API 문서입니다.')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    // --- 스웨거 설정 끝 ---
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('SERVER STARTUP ERROR:', error);
    process.exit(1);
  }
}
bootstrap();
