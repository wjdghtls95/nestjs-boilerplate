import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { CacheModule } from './cache/cache.module';
import { EncryptionModule } from './encryption/encryption.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    CoreModule,
    CacheModule,
    EncryptionModule,
    HealthModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}
