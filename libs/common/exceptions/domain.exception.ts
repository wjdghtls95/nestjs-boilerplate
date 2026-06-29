import { HttpException } from '@nestjs/common';
import { DomainError } from '../constants/errors/domain.errors';

export class DomainException extends HttpException {
  readonly code: string;

  constructor(error: DomainError) {
    super({ code: error.code, message: error.message }, error.status);
    this.code = error.code;
  }
}
