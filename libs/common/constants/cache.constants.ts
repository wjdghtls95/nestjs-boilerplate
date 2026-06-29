// 프로젝트마다 도메인별 캐시 키를 추가하세요.
// 형식: 함수로 감싸서 동적 값을 파라미터로 받도록 구성하세요.
// 예: userSession: (userId: string) => `user:session:${userId}`
export const CACHE_KEYS = {} as const;
