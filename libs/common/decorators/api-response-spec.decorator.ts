import { applyDecorators, HttpCode, HttpStatus, Type, UseGuards } from '@nestjs/common';
import { DomainError } from '../constants/errors/domain.errors';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export interface BodySpec {
  type: Type<unknown>;
  optional?: boolean;
}

export interface ApiResponseSpecOptions {
  summary: string;
  description?: string;
  auth?: boolean;
  cookieAuth?: boolean;
  body?: BodySpec;
  status?: HttpStatus;
  type?: Type<unknown>;
  isArray?: boolean;
  errors?: DomainError[];
}

export function ApiResponseSpec(options: ApiResponseSpecOptions) {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [];

  if (options.status !== undefined) {
    decorators.push(HttpCode(options.status));
  }

  decorators.push(ApiOperation({ summary: options.summary, description: options.description }));

  if (options.auth) {
    decorators.push(
      UseGuards(JwtAuthGuard),
      ApiBearerAuth('access-token'),
      ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
        schema: {
          example: {
            timestamp: '2024-01-12T00:00:00.000Z',
            path: '/example',
            error: { code: 'HTTP_401', message: 'Unauthorized' },
          },
        },
      }),
    );
  }

  if (options.cookieAuth) {
    decorators.push(ApiCookieAuth('refresh_token'));
  }

  if (options.body) {
    decorators.push(ApiBody({ type: options.body.type, required: !options.body.optional }));
  }

  decorators.push(...buildSuccessResponse(options));

  if (options.errors?.length) {
    decorators.push(...buildErrorResponses(options.errors));
  }

  return applyDecorators(...decorators);
}

function buildSuccessResponse(options: ApiResponseSpecOptions) {
  const statusCode = options.status ?? HttpStatus.OK;
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [];

  if (options.type) {
    decorators.push(ApiExtraModels(options.type));

    const description = statusCode === HttpStatus.CREATED ? '생성 성공' : '성공';
    const dataSchema = options.isArray
      ? { type: 'array', items: { $ref: getSchemaPath(options.type) } }
      : { $ref: getSchemaPath(options.type) };

    decorators.push(
      ApiResponse({
        status: statusCode,
        description,
        schema: { type: 'object', properties: { data: dataSchema } },
      }),
    );
  } else {
    decorators.push(ApiResponse({ status: statusCode, description: '성공' }));
  }

  return decorators;
}

function buildErrorResponses(errors: DomainError[]) {
  return errors.map((error) =>
    ApiResponse({
      status: error.status,
      description: error.message,
      schema: {
        example: {
          timestamp: '2024-01-12T00:00:00.000Z',
          path: '/example',
          error: { code: error.code, message: error.message },
        },
      },
    }),
  );
}
