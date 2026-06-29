# 인프라

## 로컬 개발

인프라(DB + Redis)만 Docker로 띄우고 앱은 로컬에서 실행합니다
핫리로드가 빠르고 디버거 연결이 쉽기 때문입니다

```bash
docker compose up -d        # PostgreSQL + Redis 백그라운드 실행
docker compose ps           # 컨테이너 상태 확인
docker compose logs -f      # 로그 스트리밍
docker compose down         # 종료 (데이터 보존)
docker compose down -v      # 종료 + 볼륨 삭제 (DB 초기화)
```

기본 접속 정보 (`.env`에 맞춰서 설정):

```
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
```

포트나 계정을 바꾸고 싶으면 `.env`에 아래 변수를 추가하면 `docker-compose.yml`이 그 값을 씁니다

```
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
POSTGRES_PORT=5432
REDIS_PORT=6379
```

---

## 프로덕션 빌드

`Dockerfile`은 멀티스테이지 빌드를 사용합니다

```
Stage 1 (deps):        pnpm install --frozen-lockfile --ignore-scripts
Stage 2 (builder):     prisma generate + pnpm build
Stage 3 (production):  dist/ 만 복사 — 이미지 경량화
```

```bash
# 로컬에서 프로덕션 이미지 빌드 · 실행
docker build -t my-app .
docker run --env-file .env -p 3000:3000 my-app
```

Railway · Fly.io · Cloud Run 등 컨테이너 플랫폼은 `Dockerfile`을 그대로 사용합니다

**Railway 배포 시 주의사항**
- `PORT` 환경변수를 플랫폼이 자동 주입합니다 — `app.config.ts`가 그대로 읽습니다
- `0.0.0.0` 바인딩이 `app.server.ts`에 이미 설정되어 있습니다

---

## CI — GitHub Actions

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
필수 시크릿 목록은 `.env.example` 참고 — CI yml의 `env:` 블록에 있는 이름 그대로 사용합니다
