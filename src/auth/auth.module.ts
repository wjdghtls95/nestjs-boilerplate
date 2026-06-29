import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { UserModule } from '../user/user.module';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), UserModule, EncryptionModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, RefreshTokenRepository],
  exports: [AuthService],
})
export class AuthModule {}
