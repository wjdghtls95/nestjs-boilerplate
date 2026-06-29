import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { DomainException } from '@libs/common/exceptions/domain.exception';
import { DOMAIN_ERRORS } from '@libs/common/constants/errors/domain.errors';
import googleConfig from '../../config/google.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    @Inject(googleConfig.KEY) config: ConfigType<typeof googleConfig>,
  ) {
    super({
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new DomainException(DOMAIN_ERRORS.AUTH_GOOGLE_FAILED);

    const user = await this.authService.findOrCreateUserFromGoogle({
      providerId: profile.id,
      email,
      name: profile.displayName,
    });
    done(null, user);
  }
}
