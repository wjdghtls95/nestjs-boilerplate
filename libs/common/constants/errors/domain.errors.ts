import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';

export type DomainError = BaseError;

// 프로젝트마다 도메인 에러를 추가하세요.
// 각 도메인을 섹션 주석으로 구분하고 code prefix를 맞추세요.
// 예: AUTH_xxx, USER_xxx, CONV_xxx, PAYMENT_xxx
export const DOMAIN_ERRORS = {
  // ==================== AUTH ====================
  AUTH_INVALID_REFRESH_TOKEN: {
    code: 'AUTH_001',
    message: 'Refresh token is invalid or has been revoked',
    status: HttpStatus.UNAUTHORIZED,
  },
  AUTH_REFRESH_TOKEN_EXPIRED: {
    code: 'AUTH_002',
    message: 'Refresh token has expired',
    status: HttpStatus.UNAUTHORIZED,
  },
  AUTH_FORBIDDEN: {
    code: 'AUTH_003',
    message: 'Access denied',
    status: HttpStatus.FORBIDDEN,
  },
  AUTH_GOOGLE_FAILED: {
    code: 'AUTH_004',
    message: 'Google authentication failed',
    status: HttpStatus.UNAUTHORIZED,
  },

  // ==================== USER ====================
  USER_NOT_FOUND: {
    code: 'USER_001',
    message: 'User not found',
    status: HttpStatus.NOT_FOUND,
  },
  USER_UPDATE_FAILED: {
    code: 'USER_002',
    message: 'Failed to update user',
    status: HttpStatus.BAD_REQUEST,
  },
  USER_EMAIL_ALREADY_EXISTS: {
    code: 'USER_003',
    message: 'An account with this email already exists',
    status: HttpStatus.CONFLICT,
  },

  // ==================== ENCRYPTION ====================
  ENCRYPTION_INVALID_FORMAT: {
    code: 'ENC_001',
    message: 'Encrypted value has an invalid format',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  ENCRYPTION_DECRYPT_FAILED: {
    code: 'ENC_002',
    message: 'Failed to decrypt value — key mismatch or data corruption',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
} as const satisfies Record<string, DomainError>;
