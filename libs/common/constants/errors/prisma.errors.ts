import { HttpStatus } from '@nestjs/common';
import { PRISMA_ERROR_CODES } from '../prisma-error.codes';
import { BaseError } from './base.error';

export type PrismaHttpError = BaseError;

export const PRISMA_ERRORS: Partial<Record<string, PrismaHttpError>> = {
  [PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT]: {
    code: 'HTTP_409',
    message: 'Resource already exists',
    status: HttpStatus.CONFLICT,
  },
  [PRISMA_ERROR_CODES.RECORD_NOT_FOUND]: {
    code: 'HTTP_404',
    message: 'Resource not found',
    status: HttpStatus.NOT_FOUND,
  },
  [PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT]: {
    code: 'HTTP_422',
    message: 'Related resource not found',
    status: HttpStatus.UNPROCESSABLE_ENTITY,
  },
};
