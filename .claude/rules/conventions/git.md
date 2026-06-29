## Git Convention

이 프로젝트의 git 작업 시 반드시 따를 것.

---

### 브랜치 구조

**MVP 기간 (prod 배포 전):**
```
main       ← 기본 브랜치 · 직접 배포 기준
feat/*     ← 실제 작업 브랜치
fix/*      ←
chore/*    ←
```

- `feat/*`는 `main`에서 생성 → `main`으로 merge
- `main` 직접 push 금지 — PR만
- **`/land` 이후에도 main에 직접 커밋 금지**: progress.md·history.md 업데이트 포함 모든 변경은 새 브랜치(`chore/progress-*`) → PR로 처리. 이를 어기면 local/remote main이 diverge해서 충돌 발생

**prod 배포 이후:**
```
main       ← prod 배포 전용
develop    ← dev 서버 배포 전용 · 기본 브랜치
feat/*     ← 실제 작업 브랜치
```

- `develop`이 기본 브랜치로 전환
- `feat/*`는 `develop`에서 생성 → `develop`으로 merge
- `develop → main`: PR 필수 + `/ultrareview` 실행 후 머지

---

### 브랜치 네이밍

**단독 작업 (사람이 직접):**

| 접두사 | 용도 |
|--------|------|
| `feat/<desc>` | 기능 개발 (단일 앱 또는 연관된 여러 앱) |
| `fix/<desc>` | 버그 수정 |
| `chore/<desc>` | 설정, 의존성, 리팩토링 |
| `docs/<desc>` | 문서만 수정 |
| `ci/<desc>` | CI/CD 변경 |

- desc는 kebab-case, 간결하게
- ticket-id 없음
- **앱별 브랜치 분리 필수**: server · web · mobile은 각각 별도 브랜치로 작업 후 각자 PR + 머지
  - `feat/task-domain` → server 변경만
  - `feat/task-briefing-ui` → web 변경만
  - server API가 먼저 필요한 경우: server PR 머지 후 web 브랜치 시작

---

### 커밋 메시지

형식: `<type>(<scope>): <description>`

**모노레포 scope 규칙 — 어느 앱인지 반드시 명시:**

| 변경 위치 | scope 형식 | 예시 |
|---|---|---|
| `apps/server/src/auth/` | `server/auth` | `feat(server/auth): add refresh token rotation` |
| `apps/server/src/inference/` | `server/inference` | `feat(server/inference): add searchMemories` |
| `apps/server/src/memory/` | `server/memory` | `feat(server/memory): add RAG context injection` |
| `apps/web/app/auth/` | `web/auth` | `feat(web/auth): implement OAuth callback page` |
| `apps/web/lib/` | `web` | `fix(web): fix token race condition in apiFetch` |
| `apps/web/components/` | `web/chat` 등 | `feat(web/chat): add MessageBubble component` |
| `packages/types` | `types` | `chore(types): add MemorySearchResult type` |
| `.claude/`, `AGENTS.md` | `agents` | `chore(agents): enforce R6 reporting` |
| `.husky/`, `turbo.json` | 파일명 | `chore(husky): unset NODE_OPTIONS` |

**jarvis-ai-inference는 단일 앱이므로 앱 prefix 불필요:**

| 변경 위치 | scope 형식 | 예시 |
|---|---|---|
| `app/memory/` | `memory` | `feat(memory): add POST /memory/search` |
| `app/chat/` | `chat` | `feat(chat): add streaming context injection` |
| `app/core/` | `core` | `chore(core): add MemorySearchError` |

| Type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `test` | 테스트만 추가/수정 |
| `docs` | 문서 수정 |
| `refactor` | 리팩토링 + 성능 개선 |
| `chore` | 설정, 의존성 |
| `ci` | CI/CD 변경 |
| `revert` | 커밋 되돌리기 |

금지: `style`, `perf` (각각 Prettier 자동화, refactor로 대체)

**커밋 메시지 금지 패턴:**
- `Part N`, `시나리오 A`, `Part 10 —` 같은 내부 계획 레이블 포함 금지
- 한국어 서술 금지 — description은 영어로
- 기술 내용만: 무엇을 만들었는지·바꿨는지를 직접 서술

```
❌ feat(server/task): Part 10 — 시나리오 A(아침 브리핑) + D(할 일 자동 캐치)
✅ feat(server/task): add Task + BriefingSetting domain with daily briefing cron job
```

**`chore(agents)` 메타 파일도 동일 규칙 적용** — diff에 "Part N"이 보여도 그걸 그대로 쓰지 말 것. 체크한 작업의 실제 내용(어떤 기능)을 서술.

```
❌ chore(agents): check off Part 12 Agent-Inference tasks in agent-plan.md
❌ chore(agents): update progress.md — Part 12 server + web merged
✅ chore(agents): mark inference provider abstraction and tool-use redesign as done
✅ chore(agents): update progress after slot suggestion UI and calendar quick-add
```

---

### 머지 전략

- 항상 **squash merge**
- **MVP 기간**: `feat → main`: PR 권장
- **prod 배포 이후**: `feat → develop`: PR 권장 / `develop → main`: PR 필수 + `/ultrareview` 실행 후 머지

---

### Merge Conflict 해결

**예방이 최선** — feat 브랜치를 짧게 유지 (며칠 이내), 오래 끌면 base 브랜치와 벌어짐

**발생했을 때:**
```bash
git rebase main   # (MVP 기간) main HEAD 위로 내 커밋을 다시 쌓음
# 충돌 파일 직접 수정 후
git rebase --continue
```

- `rebase`는 base 브랜치의 HEAD 위에 내 브랜치 커밋을 재적용하는 것
- 충돌 = base 브랜치와 내 브랜치가 같은 파일·같은 줄을 다르게 수정한 것
- 솔로 개발이라 충돌 자체가 드묾 — 예방만 잘 해도 거의 안 만남

**rebase 실수로 커밋이 사라진 것 같을 때:**
```bash
git reflog              # 최근 모든 HEAD 이동 기록 확인
git checkout <hash>     # 원하는 시점으로 복구
```
로컬 커밋은 최소 30일간 reflog에 남음 — main은 GitHub에 있어서 `git pull`로도 복구 가능

---

### PR 체크리스트 (feat → main, MVP 기간)

머지 전 확인:
- [ ] `/ultrareview` 완료 및 critical 이슈 없음 (보안/DB 스키마/공통 인프라 변경 시)
- [ ] 로컬에서 직접 테스트 완료
- [ ] 새 환경변수 있으면 `.env.example` 업데이트
