## Server Convention (NestJS)
> apps/server 전용

### libs/common import 규칙
- barrel export(`@libs/common`) 사용 금지 — 명시적 경로로 import
  ```ts
  // ❌ 금지
  import { BaseRepository } from '@libs/common';

  // ✅ 허용
  import { BaseRepository } from '@libs/common/repositories/base.repository';
  import { DomainException } from '@libs/common/exceptions/domain.exception';
  ```

- 새 공통 파일 추가 시 `libs/common/index.ts` 에 export 추가 금지

### DTO 네이밍
- 요청: `동사 + Entity + Dto`
- 응답: `Entity + ResponseDto`
```ts
class CreateUserDto {}
class UpdateUserDto {}
class UserResponseDto {}
```

### Prisma 스키마
- 모델명: PascalCase
- 실제 테이블명: snake_case (`@@map`)
```prisma
model RefreshToken {
  id     Int @id
  userId Int

  @@map("refresh_tokens")
  @@index([userId])
}
```

### DI 레이어 단방향
```
Controller → Service → Repository (Prisma)

금지:
  - 상위 레이어 주입 (Service → Controller)
  - 같은 레이어끼리 주입 (Service → Service)
```

### 도메인 간 의존성 & 순환 참조
- 단방향 유지: `auth → user` ✅ / `user → auth` ❌
- 양방향 필요 시 아래 순서로 해결:
```
1. 도메인 경계 재검토
   → 두 모듈이 실제로 같은 도메인인지 확인
   → 단방향으로 설계 변경 가능한지 확인

2. 공통 로직 libs/common으로 추출
   → 양쪽이 공통으로 필요한 로직

3. EventEmitter2 이벤트 기반 분리
   → 약한 결합이 필요한 도메인 간 통신
   this.eventEmitter.emit('user.created', payload)

4. forwardRef() — 절대 최후 수단
   → 위 3가지 다 불가능할 때만
   → 리팩토링 예정 주석 필수
   // UserService 상호 의존 불가피 — 리팩토링 예정
   @Inject(forwardRef(() => AuthService))
```

---

### NestJS 서비스 클래스 패턴

**모듈 레벨 함수 금지** — 클래스 밖 함수는 `private` 메서드로
```ts
// ❌ 클래스 밖 함수
function buildCacheKey(userId: string, dateKey: string): string {
  return `routine-suggestion:${userId}:${dateKey}`
}

// ✅ private 메서드
private buildCacheKey(userId: string, dateKey: string): string {
  return `routine-suggestion:${userId}:${dateKey}`
}
```

**클래스 멤버 선언 순서**
```ts
@Injectable()
export class SomeService {
  // 1. private static readonly — 클래스 상수
  private static readonly MAX_RETRY = 3;

  // 2. private readonly — 인스턴스 변수 (logger 등)
  private readonly logger = new Logger(SomeService.name);

  // 3. constructor — @Decorator 있는 파라미터 먼저
  constructor(
    @InjectQueue(QUEUE_NAME) private readonly queue: Queue,
    private readonly repository: SomeRepository,
  ) {}

  // 4. public 메서드 — 주요 흐름 순서대로
  async doWork(): Promise<void> { ... }

  // 5. private 메서드 — 호출자 먼저, 피호출자 나중
  private buildPayload(): Payload { ... }
}
```

**외부 상수 이중 선언 금지** — 별칭 없이 직접 참조
```ts
// ❌ 이중 선언
private static readonly JOB_NAME = ALERT_DISPATCH_JOB;

// ✅ 직접 참조
await this.queue.add(ALERT_DISPATCH_JOB, payload);
```

**중첩 try-catch 금지** — 부가 작업(캐시 삭제 등)은 `.catch()` 체이닝으로 분리
```ts
// ❌
try {
  const data = await this.repository.findOne(id);
  try {
    await this.cache.del(key);
  } catch (err) { this.logger.warn('cache del failed', err); }
} catch (err) { throw err; }

// ✅
const data = await this.repository.findOne(id);
await this.cache.del(key).catch((err: unknown) => {
  this.logger.warn(`cache del 실패 — TTL 만료 후 자동 소멸`, err);
});
```

---

### 상수 관리 — Redis 키 / Queue Job Name

**Redis 캐시 키** — string template 직접 사용 금지, `CACHE_KEYS` 상수 객체로 관리
```ts
// libs/common/constants/cache.constants.ts
export const CACHE_KEYS = {
  routineSuggestion: (userId: string, dateKey: string) =>
    `routine-suggestion:${userId}:${dateKey}`,
  briefing: (userId: string, dateKey: string) =>
    `briefing:${userId}:${dateKey}`,
} as const;

// ❌ 직접 template literal
return `routine-suggestion:${userId}:${dateKey}`;

// ✅
return CACHE_KEYS.routineSuggestion(userId, dateKey);
```

**Queue Job Name** — `queue.constants.ts`에 상수로 정의
```ts
// ❌ magic string
await this.queue.add('send', payload);

// ✅
import { ALERT_DISPATCH_JOB } from '@libs/common/constants/queue.constants';
await this.queue.add(ALERT_DISPATCH_JOB, payload);
```

---

### 에러 처리
- Service: `DomainException` 사용 / Controller: NestJS HTTP 예외 허용

- 빈 `catch (e) {}` 절대 금지 — 반드시 로깅 또는 rethrow

```typescript
// ❌
throw new Error('user not found')
try { ... } catch (e) {}

// ✅
throw new DomainException('USER_NOT_FOUND', '사용자를 찾을 수 없습니다')
try { ... } catch (e) { logger.error(...); throw e }
```

### Gotchas
> 공식 문서엔 없는 함정들 — Claude가 틀릴 때마다 한 줄 추가

- **NestJS `useGlobalPipes`**: DI 밖이라 Logger·Sentry 주입 불가 → `APP_PIPE` 토큰 써야 함 (`APP_FILTER`, `APP_INTERCEPTOR`도 동일)
- **Prisma `findUnique`**: `@id`, `@unique` 필드만 사용 가능 — 일반 필드 조회는 `findFirst` 써야 함
- **Prisma N+1**: loop 안에서 개별 `findOne` 금지 → `include` 또는 `findMany`로 한 번에 조회
- **NestJS `ConfigModule`**: `isGlobal: true` 설정 안 하면 사용하는 모든 모듈에서 개별 import 필요
- **`rotate()` (private) `@Transactional()` 필수**: delete(구토큰) + create(신토큰) 원자성 보장. 제거하면 delete 성공 후 create 실패 시 영구 로그아웃. `findOrCreateUserFromGoogle`과 다르게 catch 안에 DB 재쿼리 없어서 PostgreSQL aborted tx 문제 없음
- **`rotateRefreshToken` 세션 무효화는 tx 바깥에서**: `rotate()` tx 안에서 throw하면 `invalidateAllSessions`도 롤백됨 — 보안 조치가 DB에 반영 안 되는 버그. 해결 패턴: public 메서드에서 `rotate()` 호출 후 catch에서 세션 무효화 실행 (tx 완전히 종료된 뒤)
- **`@chax-at/transactional-prisma-testing` `startNewTransaction` timeout**: 기본값 5초 — 디버거 브레이크포인트에서 5초 초과 시 테스트 트랜잭션 강제 종료. `{ timeout: 30_000, maxWait: 10_000 }` 옵션 필수
- **`handleRefresh` clearCookie 조건**: `e instanceof DomainException`일 때만. 500급 인프라 오류에 clearCookie 하면 DB에 유효한 토큰이 남아있는데 사용자가 로그아웃됨
- **`@Transactional()` BullMQ context에서 `@UseCls()` 불필요**: `@nestjs-cls/transactional`의 `@Transactional()`은 내부 `runWithTransaction()`에서 직접 `cls.run({ ifNested: 'inherit' })`를 호출 — BullMQ worker(ambient CLS 없음)에서도 자체적으로 CLS context를 생성함. `ClsModule` middleware가 HTTP 전용이라 BullMQ에서 CLS가 없다는 진단은 잘못된 것 — `@Transactional()` 단독으로 충분
- **Prisma CLI (Claude Code 환경)**: `unset NODE_OPTIONS && npx prisma ...` 필수 — Claude Code가 세션마다 NODE_OPTIONS에 임시파일 주입하는데, Prisma 자식 프로세스가 해당 파일을 못 찾아 크래시. 예) `unset NODE_OPTIONS && npx prisma db push`
- **Railway 배포 — `app.listen(port, '0.0.0.0')` 필수**: 기본값은 localhost(127.0.0.1) 바인딩 — Docker/Railway에서 로드밸런서가 접근 못 해 502 발생. 반드시 두 번째 인자로 `'0.0.0.0'` 명시
- **Railway 배포 — Dockerfile `EXPOSE` 제거**: `EXPOSE {port}` 있으면 Railway가 해당 포트로 프록시 고정 — 서버가 `PORT` 환경변수 기준으로 다른 포트에서 뜨면 502. EXPOSE 없애면 Railway가 `PORT` 기준으로 자동 라우팅
- **Railway 배포 — `prisma generate` 빌드 시 더미 DATABASE_URL 필요**: `prisma.config.ts`가 config 로드 시 DATABASE_URL 검증 → `RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" prisma generate`
- **Railway 배포 — `pnpm install --ignore-scripts` 필수**: Docker에서 `prepare` 스크립트가 husky 실행 → devDep이라 없어서 빌드 실패. `--ignore-scripts`로 lifecycle 스킵 후 `prisma generate`는 별도 RUN으로 실행
- **ioredis `on('error')` 필수**: ioredis는 EventEmitter 기반 — `redis.on('error', handler)` 등록 안 하면 연결 실패 시 unhandledRejection → Node.js 프로세스 크래시. `CacheModule`에서 Redis 클라이언트 생성 직후 반드시 등록
- **Upstash Redis — TLS 연결**: BullMQ connection에 `tls: {}` + `password` 필요 — `REDIS_URL=rediss://...` 파싱해서 자동 처리 (`app.config.ts` parseRedis() 참고)
