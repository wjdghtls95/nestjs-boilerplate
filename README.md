# nestjs-boilerplate

NestJS 백엔드를 시작할 때 매번 반복하는 세팅을 없앤 보일러플레이트
ORM·OAuth provider를 모듈 교체만으로 바꿀 수 있도록 인터페이스 기반으로 설계했습니다

Claude Code 룰 포함 — 컨벤션 강제, 코드 리뷰 자동화, 학습 시스템

---

## 스택

```
Server:  NestJS
DB:      PostgreSQL · Redis
ORM:     Prisma (교체 가능 — 교체 포인트 참고)
Auth:    JWT · Refresh Token Rotation · OAuth (provider 선택)
Infra:   Docker · GitHub Actions · Sentry
```

---

## 파일 구조

```
nestjs-boilerplate/
│
├── src/
│   ├── auth/                            # JWT + IProviderAdapter 프레임
│   │   ├── interfaces/
│   │   │   ├── token-pair.interface.ts
│   │   │   └── provider-adapter.interface.ts  # OAuth 교체 포인트
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── google.strategy.ts             # provider 예제
│   │   ├── repositories/
│   │   │   └── refresh-token.repository.ts
│   │   └── auth.service.ts                    # refresh rotation 로직
│   │
│   ├── user/                            # 기본 CRUD 뼈대
│   ├── cache/                           # Redis + 에러 처리 완성본
│   ├── encryption/                      # AES-256 EncryptionModule
│   ├── database/                        # ORM 교체 포인트
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   ├── health/                          # GET /health
│   ├── core/                            # CLS + ValidationPipe + AllExceptionFilter
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── jwt.config.ts
│   │   └── google.config.ts
│   ├── app.module.ts
│   ├── app.server.ts                    # helmet · cors · swagger 세팅
│   └── main.ts
│
├── libs/common/                         # 모든 도메인에서 공유
│   ├── exceptions/
│   │   ├── domain.exception.ts
│   │   ├── system.exception.ts
│   │   └── cache.exception.ts
│   ├── filters/
│   │   └── all-exception.filter.ts      # Sentry 자동 전송 포함
│   ├── repositories/
│   │   └── base.repository.ts           # BaseRepository (ORM 무관)
│   ├── constants/
│   │   └── errors/
│   │       ├── base.error.ts
│   │       ├── domain.errors.ts         # 프로젝트마다 채울 것
│   │       └── system.errors.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── api-response-spec.decorator.ts
│   ├── dto/
│   │   ├── base-response.dto.ts
│   │   └── pagination.dto.ts
│   ├── encryption/
│   │   └── encryption.service.ts
│   └── utils/
│       ├── time.util.ts
│       └── sse.util.ts
│
├── prisma/
│   └── schema.prisma                    # User + Account + RefreshToken 기본값
│
├── examples/
│   └── typeorm/                         # TypeORM 교체 시 참고
│       ├── user.entity.ts
│       └── refresh-token.entity.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml                       # Lint · Typecheck · Test
│
├── .claude/                             # Claude Code 룰
│   ├── rules/
│   └── commands/
│
├── Dockerfile                           # 멀티스테이지 프로덕션 빌드
├── docker-compose.yml                   # 로컬 개발용 PostgreSQL + Redis
└── .env.example
```

---

## 시작하기

```bash
git clone https://github.com/xxx/nestjs-boilerplate my-project
cd my-project
pnpm install
cp .env.example .env   # 값 채우기
```

### 1 — 인프라 실행 (PostgreSQL + Redis)

```bash
docker compose up -d
```

컨테이너가 뜨면 `.env`의 DATABASE_URL · REDIS_URL을 아래 기본값으로 맞추면 됩니다

```
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
```

포트나 계정을 바꾸고 싶으면 `.env`에 아래를 추가하면 docker-compose.yml이 그 값을 씁니다

```
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
POSTGRES_PORT=5432
REDIS_PORT=6379
```

### 2 — DB 마이그레이션

```bash
npx prisma migrate dev
```

### 3 — 서버 실행

```bash
pnpm dev
```

서버가 뜨면 Swagger: `http://localhost:3000/api-docs`

---

## 교체 포인트

### ORM — TypeORM으로 교체할 때

```bash
pnpm add @nestjs-cls/transactional-adapter-typeorm typeorm
```

```
변경되는 파일
  database/database.module.ts     TransactionalAdapterTypeOrm으로 교체
  database/database.service.ts    DataSource로 교체
  libs/common/repositories/
    base.repository.ts            BaseRepository 구현체 교체
  각 도메인 repository             db 호출 방식 변경 (Prisma → typeorm)

변경 없는 파일 (그대로 동작)
  @Transactional()                라이브러리 어댑터가 처리
  AllExceptionFilter              Prisma 에러 블록만 제거
  DomainException / SystemException
  CacheModule
  auth/ user/ (서비스·컨트롤러)
```

TypeORM 엔티티 예제 → `examples/typeorm/`

### OAuth Provider — Kakao 추가할 때

```typescript
// src/auth/strategies/kakao.strategy.ts 생성
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  async validate(accessToken: string, _: string, profile: any, done: VerifyCallback) { ... }
}
```

```
추가되는 파일
  auth/strategies/kakao.strategy.ts
  config/kakao.config.ts

변경 없는 파일
  auth.service.ts
  jwt.strategy.ts
  refresh-token.repository.ts
```

---

## 포함된 것

| 영역 | 내용 |
|------|------|
| 예외 처리 | DomainException · SystemException · AllExceptionFilter (Sentry 자동 전송) |
| 트랜잭션 | @Transactional() · BaseRepository · CLS 전파 |
| 캐시 | CacheModule (Redis + 에러 처리 + retryStrategy) |
| 인증 | JWT · Refresh Token Rotation · IProviderAdapter |
| 공통 | PaginationDto · Health Check · AES-256 EncryptionService |
| 도구 | TimeUtil · SseUtil |
| 인프라 | Dockerfile (멀티스테이지) · docker-compose.yml · GitHub Actions CI |
| Claude Code | 컨벤션 룰 · /ship · /learn 스킬 |

---

## 인프라

### 로컬 개발

인프라(DB + Redis)만 Docker로 띄우고 앱은 로컬에서 실행합니다
핫리로드가 빠르고 디버거 연결이 쉽기 때문입니다

```bash
docker compose up -d        # PostgreSQL + Redis 백그라운드 실행
docker compose ps           # 컨테이너 상태 확인
docker compose logs -f      # 로그 스트리밍
docker compose down         # 종료 (데이터 보존)
docker compose down -v      # 종료 + 볼륨 삭제 (DB 초기화)
```

### 프로덕션 빌드

`Dockerfile`은 멀티스테이지 빌드를 사용합니다

```
Stage 1 (deps):        pnpm install --frozen-lockfile
Stage 2 (builder):     prisma generate + pnpm build
Stage 3 (production):  dist/ 만 복사 — 이미지 경량화
```

```bash
# 로컬에서 프로덕션 이미지 빌드 · 실행
docker build -t my-app .
docker run --env-file .env -p 3000:3000 my-app
```

Railway · Fly.io · Cloud Run 등 컨테이너 플랫폼은 `Dockerfile`을 그대로 사용합니다

Railway 배포 시 주의사항:
- `PORT` 환경변수를 플랫폼이 자동 주입합니다 — `app.config.ts`가 그대로 읽습니다
- `0.0.0.0` 바인딩이 `app.server.ts`에 이미 설정되어 있습니다

### CI — GitHub Actions

`.github/workflows/ci.yml`이 main 브랜치 push · PR마다 자동 실행됩니다

```
실행 순서
  1  pnpm install
  2  prisma generate + migrate deploy (테스트 DB)
  3  tsc --noEmit (타입체크)
  4  eslint (린트)
  5  jest (유닛 테스트)
```

CI에서 사용하는 시크릿은 GitHub repository → Settings → Secrets에 등록해야 합니다
필수 시크릿 목록은 `.env.example` 참고 — CI yml에서 `env:` 블록을 그대로 시크릿 이름으로 사용합니다

---

## 네이밍 컨벤션

### 변수
```typescript
const isLoading = true            // Boolean: is/has/can prefix 필수
const friends = ['Bob']           // 복수형
const DAILY_FREE_LIMIT = 20       // 비즈니스 상수: UPPER_SNAKE_CASE
const maxRetry = 3                // 로컬 임시 상수: camelCase
```

### 함수 — A/HC/LC 패턴
```typescript
getUser()              // action + HighContext
getUserMessages()      // action + HighContext + LowContext
shouldDisplayCard()    // prefix + action + Context
```

### 클래스 멤버 순서
```typescript
@Injectable()
class SomeService {
  private static readonly MAX = 3        // 1 클래스 상수
  private readonly logger = new Logger() // 2 인스턴스 변수
  constructor(...) {}                    // 3 생성자
  async publicMethod() {}                // 4 public 메서드
  private helper() {}                    // 5 private 메서드
}
```

### DTO
```typescript
class CreateUserDto {}      // 요청: 동사 + Entity + Dto
class UserResponseDto {}    // 응답: Entity + ResponseDto
```

### 금지
```typescript
// any 타입 → unknown + 타입 가드로 대체
// as Type 강제 캐스팅 → 타입 가드로 대체
// 빈 catch {} → 반드시 로깅 또는 rethrow
// 중첩 3단계 이상 → guard clause 또는 메서드 추출
// 모듈 레벨 함수 → private 메서드로
// let result 암묵적 any → .catch() 체이닝으로 const 사용
```

---

## Claude Code 룰

`.claude/` 폴더에 포함 — 세션 시작마다 자동 로드

| 룰 | 역할 |
|---|---|
| karpathy-guidelines | 코드 생성 전 충분히 생각하기 |
| code-gen-protocol | R6 체크리스트 (Intent → Testability) |
| code-consistency | 기존 패턴과 일관성 깨지면 플래그 |
| conventions/ | 위 컨벤션 자동 강제 |
| /ship | commit → push → PR 자동화 |
| /learn | 개념 학습 페이지 생성 (Obsidian) |

### 개발 흐름

```
┌─────────────────────────────────────────────────────────────┐
│  세션 시작                                                    │
│  claude "기능 구현해줘"                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Claude가 자동으로 로드                                       │
│  CLAUDE.md → .claude/rules/ (karpathy + code-gen + 컨벤션)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  코드 생성 전 — code-gen-protocol R6 체크                    │
│                                                              │
│  R1  Intent      이 코드가 정확히 무슨 문제를 푸는가?         │
│  R2  Adversarial 약점 2가지를 찾아서 해결하라                 │
│  R3  Reference   유사한 오픈소스 패턴과 비교                  │
│  R4  Simplicity  절반으로 줄일 수 있는가?                    │
│  R5  Durability  3개월 뒤 변경 요청에 버티는가?              │
│  R6  Testability 의존성 1개 이하로 유닛 테스트 가능한가?     │
│                                                              │
│  하나라도 미해결 → 코드 생성 안 함, 사람에게 질문            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  구현 중 — conventions 자동 강제                             │
│                                                              │
│  · 기존 패턴과 다른 코드 → ⚠️ 일관성 체크 플래그            │
│  · 같은 로직 3번째 등장 → ⚠️ Rule of Three 플래그           │
│  · 함수 50줄 초과 → 분리 권고                               │
│  · any 타입 / 빈 catch → 즉시 수정                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  완료 후 — /ship                                             │
│                                                              │
│  1  git diff 읽고 커밋 메시지 자동 생성                      │
│     → 확인 후 commit                                         │
│  2  git push origin <branch>                                 │
│  3  gh pr create (PR 없으면 자동 생성)                       │
│  4  변경 파일 분석 → 리뷰 tier 자동 판단                    │
│                                                              │
│     auth / libs/common / schema.prisma 변경                  │
│     → 🔴 /ultrareview (멀티 에이전트 클라우드 리뷰)          │
│                                                              │
│     새 모듈 / 외부 API / 트랜잭션 변경                       │
│     → 🟡 /code-review --comment (PR 인라인 코멘트)           │
│                                                              │
│     파일 1~5개 / 위 해당 없음                               │
│     → 🟢 리뷰 생략                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  리뷰 완료 → squash merge → main                            │
└─────────────────────────────────────────────────────────────┘
```

**모르는 개념이 나왔을 때 — `/learn <개념명>`**

```
/learn "CLS 트랜잭션 전파"
  → 개념 페이지 생성 제안 (디렉토리 + 전제 개념 목록)
  → 확인 후 학습/NestJS/CLS.md 생성
  → _Index.md 자동 업데이트
```
