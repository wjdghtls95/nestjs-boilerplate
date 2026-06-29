import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser = require('cookie-parser');
import helmet from 'helmet';

export class AppServer {
  private readonly config: ConfigService;
  private readonly logger = new Logger(AppServer.name);

  constructor(private readonly app: INestApplication) {
    this.config = app.get(ConfigService);
    this.init();
  }

  private init(): void {
    this.app.use(helmet());
    this.app.use(cookieParser());

    this.app.enableCors({
      origin: this.config.getOrThrow<string>('app.webUrl'),
      credentials: true,
    });

    if (this.config.getOrThrow<string>('app.nodeEnv') !== 'production') {
      this.setupSwagger();
    }
  }

  private setupSwagger(): void {
    const config = new DocumentBuilder()
      .setTitle('My API')
      .setDescription('API 문서')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addCookieAuth('refresh_token')
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('/api-docs', this.app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  async run(): Promise<void> {
    const port = this.config.getOrThrow<number>('app.port');
    await this.app.listen(port, '0.0.0.0');
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    const baseUrl = domain ? `https://${domain}` : `http://localhost:${port}`;
    this.logger.log(`Server running on ${baseUrl}`);
    if (this.config.getOrThrow<string>('app.nodeEnv') !== 'production') {
      this.logger.log(`Swagger: ${baseUrl}/api-docs`);
    }
  }
}
