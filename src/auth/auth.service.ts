import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, Provider, User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { addDays } from '@libs/common/utils/time.util';
import { PRISMA_ERROR_CODES } from '@libs/common/constants/prisma-error.codes';
import { DomainException } from '@libs/common/exceptions/domain.exception';
import { DOMAIN_ERRORS } from '@libs/common/constants/errors/domain.errors';
import jwtConfig, { JwtConfig } from '../config/jwt.config';
import appConfig, { AppConfig } from '../config/app.config';
import { TokenPair } from './interfaces/token-pair.interface';
import { UserRepository } from '../user/repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

interface GoogleProfile {
  providerId: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfig: JwtConfig,
    @Inject(appConfig.KEY) private readonly appConfig: AppConfig,
  ) {}

  // @Transactional() 없음: Prisma tx 안에서 P2002 catch 후 재쿼리 불가 (PostgreSQL tx aborted state)
  async findOrCreateUserFromGoogle(profile: GoogleProfile): Promise<User> {
    try {
      return await this.userRepository.createWithGoogle({
        email: profile.email,
        name: profile.name,
        providerId: profile.providerId,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT
      ) {
        const account = await this.userRepository.findByProvider(Provider.GOOGLE, profile.providerId);

        if (account) return account.user;

        throw new DomainException(DOMAIN_ERRORS.USER_EMAIL_ALREADY_EXISTS);
      }
      throw e;
    }
  }

  async generateTokenPair(userId: string): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      { sub: userId, jti: randomUUID() as string },
      {
        secret: this.jwtConfig.accessSecret,
        expiresIn: this.jwtConfig.accessExpiresIn as any,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, jti: randomUUID() as string },
      {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: this.jwtConfig.refreshExpiresIn as any,
      },
    );

    await this.refreshTokenRepository.create({
      userId,
      token: refreshToken,
      expiresAt: addDays(new Date(), this.parseRefreshExpiresInDays()),
    });

    return { accessToken, refreshToken };
  }

  // delete + create 원자성 보장 — 제거하면 영구 로그아웃
  // 세션 무효화는 tx 바깥에서 실행 — tx rollback에 말려들면 보안 조치가 DB에 반영 안 됨
  async rotateRefreshToken(oldToken: string): Promise<TokenPair> {
    try {
      return await this.rotate(oldToken);
    } catch (e) {
      if (e instanceof DomainException) {
        if (e.code === DOMAIN_ERRORS.AUTH_INVALID_REFRESH_TOKEN.code) {
          await this.invalidateSessionsFromToken(oldToken, true);
        } else if (e.code === DOMAIN_ERRORS.AUTH_REFRESH_TOKEN_EXPIRED.code) {
          await this.invalidateSessionsFromToken(oldToken, true);
        }
      }
      throw e;
    }
  }

  buildRefreshCookieOptions() {
    const days = this.parseRefreshExpiresInDays();
    return {
      httpOnly: true,
      secure: this.appConfig.nodeEnv === 'production',
      sameSite: 'none' as const,
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/',
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.deleteByToken(token);
  }

  async validateAccessToken(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  // delete-first: findUnique → delete TOCTOU 제거. DB 원자적 삭제로 동시 요청 중 하나만 성공.
  @Transactional()
  private async rotate(oldToken: string): Promise<TokenPair> {
    let stored: { userId: string; expiresAt: Date };
    try {
      stored = await this.refreshTokenRepository.deleteAndReturn(oldToken);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PRISMA_ERROR_CODES.RECORD_NOT_FOUND
      ) {
        throw new DomainException(DOMAIN_ERRORS.AUTH_INVALID_REFRESH_TOKEN);
      }
      throw e;
    }

    if (stored.expiresAt < new Date()) {
      throw new DomainException(DOMAIN_ERRORS.AUTH_REFRESH_TOKEN_EXPIRED);
    }

    return this.generateTokenPair(stored.userId);
  }

  private async invalidateSessionsFromToken(token: string, ignoreExpiration = false): Promise<void> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.jwtConfig.refreshSecret,
        ignoreExpiration,
      });

      await this.refreshTokenRepository.deleteByUserId(payload.sub);
    } catch {
      // 위조 토큰 — userId 불명, 전체 무효화 불가
    }
  }

  private parseRefreshExpiresInDays(): number {
    const raw = this.jwtConfig.refreshExpiresIn;
    const match = raw.match(/^(\d+)d$/);
    return match ? parseInt(match[1], 10) : 7;
  }
}
