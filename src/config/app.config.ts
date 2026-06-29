import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  webUrl: string;
  redisUrl: string;
  encryptionKey: string;
  sentryDsn: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    webUrl: process.env.WEB_URL ?? 'http://localhost:4000',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    encryptionKey: process.env.ENCRYPTION_KEY!,
    sentryDsn: process.env.SENTRY_DSN ?? '',
  }),
);
