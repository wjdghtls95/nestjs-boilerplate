import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';

export type CacheError = BaseError;

// CacheException과 함께 활성화. 현재 CacheService는 에러를 .catch()로 처리하므로 미사용.
export const CACHE_ERRORS = {
  REPLY_ERROR: {
    code: 'CACHE_001',
    message: 'Cache operation failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
} as const satisfies Record<string, CacheError>;
