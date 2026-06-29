# nestjs-boilerplate

NestJS 백엔드를 시작할 때 매번 반복하는 세팅을 없앤 보일러플레이트
ORM·OAuth provider를 모듈 교체만으로 바꿀 수 있도록 인터페이스 기반으로 설계했습니다

Claude Code 룰 포함 — 컨벤션 강제, 코드 리뷰 자동화

---

## 스택

```
Server:  NestJS
DB:      PostgreSQL · Redis
ORM:     Prisma (교체 가능)
Auth:    JWT · Refresh Token Rotation · OAuth (provider 선택)
Infra:   Docker · GitHub Actions · Sentry
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

## 이 레포 사용하기

**방법 1 — GitHub Template (권장)**

GitHub 레포 상단의 **Use this template** 버튼 클릭 → 새 레포 이름 입력 → Create repository

git history 없이 깔끔한 새 레포로 시작합니다

**방법 2 — Fork**

레포 상단 **Fork** 버튼 클릭

upstream(이 레포)의 업데이트를 나중에 pull 받고 싶을 때 사용합니다

**방법 3 — Clone**

```bash
git clone https://github.com/wjdghtls95/nestjs-boilerplate my-project
cd my-project
git remote remove origin   # 기존 origin 제거
git remote add origin https://github.com/<your-username>/<your-repo>.git
```

---

## 시작하기

```bash
pnpm install
cp .env.example .env   # 값 채우기
```

**1 — 인프라 실행**

```bash
docker compose up -d
```

**2 — DB 마이그레이션**

```bash
npx prisma migrate dev
```

**3 — 서버 실행**

```bash
pnpm dev
```

서버가 뜨면 Swagger: `http://localhost:3000/api-docs`

---

## 문서

| 문서 | 내용 |
|------|------|
| [인프라](docs/infra.md) | 로컬 Docker, 프로덕션 빌드, CI/CD |
| [교체 포인트](docs/swap-points.md) | ORM 교체, OAuth provider 추가 |
| [컨벤션](docs/conventions.md) | 네이밍, 금지 패턴, 코드 스타일 |
| [Claude Code 워크플로우](docs/claude-workflow.md) | /ship · /learn · R6 개발 흐름 |
