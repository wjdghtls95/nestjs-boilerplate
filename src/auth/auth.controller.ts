import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { DomainException } from '@libs/common/exceptions/domain.exception';
import { DOMAIN_ERRORS } from '@libs/common/constants/errors/domain.errors';
import { CurrentUser } from '@libs/common/decorators/current-user.decorator';
import { ApiResponseSpec } from '@libs/common/decorators/api-response-spec.decorator';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleMobileReqDto } from './dto/google-mobile-req.dto';
import { RefreshReqDto } from './dto/refresh-req.dto';
import appConfig, { AppConfig } from '../config/app.config';
import { UserProfileResponseDto } from '../user/dto/user-profile-res.dto';

const REFRESH_TOKEN_COOKIE = 'refresh_token';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY) private readonly appConfig: AppConfig,
  ) {}

  // ── Web OAuth ──────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiResponseSpec({
    summary: 'Google OAuth 로그인 시작 (웹)',
    description: 'Google 로그인 페이지로 리다이렉트',
    status: HttpStatus.FOUND,
  })
  handleGoogleLogin() {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async handleGoogleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = await this.authService.generateTokenPair(user.id);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, this.authService.buildRefreshCookieOptions());

    res.redirect(`${this.appConfig.webUrl}/auth/callback#token=${tokens.accessToken}`);
  }

  // ── Mobile OAuth ───────────────────────────────────────────────────

  @Post('google/mobile')
  @ApiResponseSpec({
    summary: 'Google OAuth 로그인 (모바일 — PKCE)',
    body: { type: GoogleMobileReqDto },
    errors: [DOMAIN_ERRORS.AUTH_GOOGLE_FAILED],
  })
  async handleGoogleMobile(@Body() _body: GoogleMobileReqDto) {
    // TODO: PKCE code + code_verifier 교환 구현
    throw new DomainException(DOMAIN_ERRORS.AUTH_GOOGLE_FAILED);
  }

  // ── Token management ───────────────────────────────────────────────

  @Post('refresh')
  @ApiResponseSpec({
    summary: 'Access Token 갱신',
    description: '웹: httpOnly 쿠키 / 모바일: body로 refreshToken 전달',
    cookieAuth: true,
    body: { type: RefreshReqDto, optional: true },
    errors: [DOMAIN_ERRORS.AUTH_INVALID_REFRESH_TOKEN, DOMAIN_ERRORS.AUTH_REFRESH_TOKEN_EXPIRED],
  })
  async handleRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshReqDto,
  ) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? body.refreshToken;
    if (!token) throw new DomainException(DOMAIN_ERRORS.AUTH_INVALID_REFRESH_TOKEN);

    const isWebClient = !!req.cookies?.[REFRESH_TOKEN_COOKIE];

    const tokens = await this.authService.rotateRefreshToken(token).catch((e) => {
      if (isWebClient && e instanceof DomainException) {
        res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
      }
      throw e;
    });

    if (isWebClient) {
      res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, this.authService.buildRefreshCookieOptions());
      return { data: { accessToken: tokens.accessToken } };
    }

    return { data: tokens };
  }

  @Post('logout')
  @ApiResponseSpec({
    summary: '로그아웃',
    status: HttpStatus.NO_CONTENT,
    cookieAuth: true,
    body: { type: RefreshReqDto, optional: true },
  })
  async handleLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: RefreshReqDto,
  ) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? body.refreshToken;
    if (token) await this.authService.revokeRefreshToken(token);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  @Get('me')
  @ApiResponseSpec({
    summary: '내 프로필 조회',
    auth: true,
    type: UserProfileResponseDto,
  })
  handleMe(@CurrentUser() user: User) {
    return { data: UserProfileResponseDto.fromEntity(user) };
  }
}
