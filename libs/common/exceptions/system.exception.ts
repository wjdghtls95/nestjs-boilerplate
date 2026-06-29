import { HttpException } from '@nestjs/common';
import { SystemError } from '../constants/errors/system.errors';

export class SystemException extends HttpException {
  readonly code: string;
  readonly cause: Error | null;

  constructor(error: SystemError, cause?: Error) {
    super({ code: error.code, message: error.message }, error.status);
    this.code = error.code;
    this.cause = cause ?? null;
  }
}
