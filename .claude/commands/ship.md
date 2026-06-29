## /ship — Commit · Push · PR · Code Review

Automates the full delivery loop after coding is done.

### Arguments
- `/ship` — auto-generate commit message from diff, confirm before applying
- `/ship "message"` — use provided message directly
- `/ship --no-review` — skip code review step

---

### Step 1 — Check state

Run `git status` and `git diff HEAD --stat`.

If nothing to commit: output "변경사항 없음 — 커밋할 내용이 없습니다." and stop.

---

### Step 2 — Prepare commit message

**If message provided as argument:** use it as-is, skip to Step 3.

**If no message:**
- Read `git diff HEAD` (full diff)
- Generate a commit message following `.claude/rules/conventions/git.md`:
  - Format: `<type>(<scope>): <description>`
  - Scope must reflect which app changed (e.g. `server/auth`, `web/chat`, `agents`)
- Output: `커밋 메시지: \`[generated message]\` — 맞나요? (ㅇㅇ / 수정)`
- Wait for confirmation. If user edits: use their version.

---

### Step 3 — Stage and commit

Run `git status --short` to list modified/new files.
Stage only relevant files — do NOT use `git add -A`. Avoid `.env`, secrets.
Run `git commit -m "[message]"`.

---

### Step 4 — Push

Run `git push origin <current-branch>`.
If no upstream set: run `git push -u origin <current-branch>`.

---

### Step 5 — PR check

Run `gh pr list --head <current-branch> --state open --json number,title`.

- **PR exists** → output "PR #N 이미 열려있음 — 새 커밋이 추가됐습니다." Skip to Step 6.
- **No PR** → run `gh pr create --fill`. Output the PR URL.

---

### Step 6 — Code review decision

If `--no-review` flag: output "리뷰 생략." and stop.

Read changed file paths and apply `.claude/rules/code-review.md` checklist:

**🔴 → `/ultrareview`** if any of:
- `auth/`, JWT, token, refresh, session 관련
- `libs/common/` 수정
- `prisma/schema.prisma` 수정
- 결제·과금, Guard, 암호화·해시
- `develop → main` PR

**🟡 → `/code-review --comment`** if any of:
- DTO 구조 변경
- 새 도메인 모듈 첫 완성
- 외부 API 연동, BullMQ worker
- Global middleware / interceptor / filter 수정
- 트랜잭션 로직, 에러 핸들링 패턴 변경
- 파일 6~15개

**🟢 → 리뷰 생략** if:
- 위 해당 없음 + 파일 1~5개

Output which tier was selected and why (one line), then execute the review command.
