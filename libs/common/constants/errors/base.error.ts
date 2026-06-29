import { HttpStatus } from '@nestjs/common';

export type BaseError = {
  code: string;
  message: string;
  status: HttpStatus;
};
