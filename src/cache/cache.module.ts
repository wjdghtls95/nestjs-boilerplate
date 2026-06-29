import { Logger, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Redis } from 'ioredis';
import appConfig from '../config/app.config';
import { CacheService } from './cache.service';

const redisLogger = new Logger('RedisClient');

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => {
        const client = new Redis(config.redisUrl, {
          // ioredis는 EventEmitter — on('error') 없으면 ReplyError 시 Node.js 프로세스 크래시
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });

        client.on('error', (err: Error) => {
          redisLogger.error('Redis 연결 에러', err.message);
        });

        return client;
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
