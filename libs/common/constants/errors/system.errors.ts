import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';

export type SystemError = BaseError;

export const SYSTEM_ERRORS = {
  // ==================== DATABASE ====================
  SYS_DB_CONNECTION_ERROR: {
    code: 'SYS_001',
    message: 'Database connection failed',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  },
  SYS_DB_QUERY_ERROR: {
    code: 'SYS_002',
    message: 'Database query failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // ==================== CACHE ====================
  SYS_REDIS_CONNECTION_ERROR: {
    code: 'SYS_010',
    message: 'Redis connection failed',
    status: HttpStatus.SERVICE_UNAVAILABLE,
  },

  // ==================== EXTERNAL API ====================
  SYS_EXTERNAL_API_TIMEOUT: {
    code: 'SYS_020',
    message: 'External API request timed out',
    status: HttpStatus.GATEWAY_TIMEOUT,
  },
  SYS_EXTERNAL_API_ERROR: {
    code: 'SYS_021',
    message: 'External API call failed',
    status: HttpStatus.BAD_GATEWAY,
  },

  // ==================== GENERAL ====================
  SYS_INTERNAL_SERVER_ERROR: {
    code: 'SYS_999',
    message: 'Internal server error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
} as const satisfies Record<string, SystemError>;
