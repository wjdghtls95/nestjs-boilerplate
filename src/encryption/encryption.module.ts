import { Module } from '@nestjs/common';
import appConfigToken, { AppConfig } from '../config/app.config';
import { EncryptionService } from '@libs/common/encryption/encryption.service';

@Module({
  providers: [
    {
      provide: EncryptionService,
      inject: [appConfigToken.KEY],
      useFactory: (config: AppConfig): EncryptionService =>
        new EncryptionService(config.encryptionKey),
    },
  ],
  exports: [EncryptionService],
})
export class EncryptionModule {}
