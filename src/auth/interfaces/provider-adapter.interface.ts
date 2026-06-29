// OAuth provider 교체 포인트.
// 새 provider 추가 시: IProviderAdapter를 구현하는 Strategy를 만들고 AuthModule에 등록.
// 예: kakao.strategy.ts, apple.strategy.ts
export interface OAuthProfile {
  providerId: string;
  email: string;
  name: string;
}

export interface IProviderAdapter {
  validate(...args: unknown[]): Promise<OAuthProfile>;
}
