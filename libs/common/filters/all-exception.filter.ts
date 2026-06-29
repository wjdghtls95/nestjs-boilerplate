import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { ReplyError } from 'ioredis';
import * as Sentry from '@sentry/nestjs';
import { DomainException } from '../exceptions/domain.exception';
import { SystemException } from '../exceptions/system.exception';
import { CacheException } from '../exceptions/cache.exception';
import { SYSTEM_ERRORS } from '../constants/errors/system.errors';
import { PRISMA_ERRORS } from '../constants/errors/prisma.errors';
import { CACHE_ERRORS } from '../constants/errors/cache.errors';
import { VALIDATION_ERROR_CODE } from '../constants/error-codes';

interface ErrorInfo {
  httpStatus: number;
  code: string;
  message: string | object;
  isSystemError: boolean;
  cause: Error | null;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const errorInfo = this.resolveErrorInfo(exception);

    const responseBody = {
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
      },
    };

    httpAdapter.reply(response, responseBody, errorInfo.httpStatus);
    this.logError(request, errorInfo, exception);
  }

  private resolveErrorInfo(exception: unknown): ErrorInfo {
    if (exception instanceof DomainException) {
      const res = exception.getResponse() as { code: string; message: string };
      return {
        httpStatus: exception.getStatus(),
        code: res.code,
        message: res.message,
        isSystemError: exception.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR,
        cause: null,
      };
    }

    if (exception instanceof SystemException) {
      const res = exception.getResponse() as { code: string; message: string };
      return {
        httpStatus: exception.getStatus(),
        code: res.code,
        message: res.message,
        isSystemError: true,
        cause: exception.cause,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    // CacheException: CacheService가 throw 방식으로 전환될 때 활성화
    // ReplyError: HTTP 컨텍스트에서 ioredis 에러가 직접 올라올 경우 안전망
    if (exception instanceof CacheException || exception instanceof ReplyError) {
      return this.resolveCacheError(exception as CacheException | Error);
    }

    if (exception instanceof HttpException) {
      const httpStatus = exception.getStatus();
      const res = exception.getResponse() as any;

      if (res?.code === VALIDATION_ERROR_CODE) {
        return {
          httpStatus,
          code: VALIDATION_ERROR_CODE,
          message: res.errors,
          isSystemError: false,
          cause: null,
        };
      }

      return {
        httpStatus,
        code: `HTTP_${httpStatus}`,
        message: res?.message ?? exception.message,
        isSystemError: httpStatus >= HttpStatus.INTERNAL_SERVER_ERROR,
        cause: null,
      };
    }

    return {
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      code: SYSTEM_ERRORS.SYS_INTERNAL_SERVER_ERROR.code,
      message: SYSTEM_ERRORS.SYS_INTERNAL_SERVER_ERROR.message,
      isSystemError: true,
      cause: exception instanceof Error ? exception : new Error(String(exception)),
    };
  }

  private resolveCacheError(exception: CacheException | Error): ErrorInfo {
    if (exception instanceof CacheException) {
      return {
        httpStatus: exception.status,
        code: exception.code,
        message: exception.message,
        isSystemError: true,
        cause: exception,
      };
    }

    return {
      httpStatus: CACHE_ERRORS.REPLY_ERROR.status,
      code: CACHE_ERRORS.REPLY_ERROR.code,
      message: CACHE_ERRORS.REPLY_ERROR.message,
      isSystemError: true,
      cause: exception,
    };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError): ErrorInfo {
    const mapped = PRISMA_ERRORS[exception.code];

    if (mapped) {
      return {
        httpStatus: mapped.status,
        code: mapped.code,
        message: mapped.message,
        isSystemError: false,
        cause: null,
      };
    }

    return {
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      code: SYSTEM_ERRORS.SYS_DB_QUERY_ERROR.code,
      message: SYSTEM_ERRORS.SYS_DB_QUERY_ERROR.message,
      isSystemError: true,
      cause: exception,
    };
  }

  private logError(request: any, errorInfo: ErrorInfo, exception: unknown): void {
    const logInfo = {
      method: request.method,
      url: request.url,
      statusCode: errorInfo.httpStatus,
      code: errorInfo.code,
      userId: request.user?.id ?? 'anonymous',
    };

    if (errorInfo.isSystemError) {
      this.logger.error(logInfo, errorInfo.cause?.stack ?? (exception as any)?.stack);
      try {
        Sentry.captureException(exception);
      } catch {
        // Sentry 장애가 HTTP 응답에 영향을 줘서는 안 됨
      }
    } else {
      this.logger.warn(logInfo);
    }
  }
}
