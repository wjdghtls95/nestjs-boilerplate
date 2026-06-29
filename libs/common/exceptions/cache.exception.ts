import { CacheError } from '../constants/errors/cache.errors';

// CacheService가 에러를 throw하는 방식으로 전환될 때 사용.
// 현재 CacheService는 에러를 호출부 .catch()로 처리하므로 미사용.
export class CacheException extends Error {
  readonly code: string;
  readonly status: number;

  constructor(error: CacheError) {
    super(error.message);
    this.code = error.code;
    this.status = error.status;
  }
}
