import { ClsServiceManager } from 'nestjs-cls';

// test env에서 ClsServiceManager 없이 동작하기 위한 fallback
const testContext: Record<string, unknown> = {};

export class ContextProvider {
  static get<T>(key: string): T {
    return process.env.NODE_ENV === 'test'
      ? (testContext[key] as T)
      : (ClsServiceManager.getClsService().get(key) as T);
  }

  static set<T>(key: string, value: T): void {
    if (process.env.NODE_ENV === 'test') {
      testContext[key] = value;
    } else {
      ClsServiceManager.getClsService().set(key, value);
    }
  }

  // 테스트 간 context 초기화
  static reset(): void {
    Object.keys(testContext).forEach((key) => delete testContext[key]);
  }
}
