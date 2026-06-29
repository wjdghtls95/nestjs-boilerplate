## Ship Reminder Rule

### 트리거

이번 응답에서 소스 코드 파일(`.ts`, `.tsx`, `.py`, `.prisma`, `.json` 설정 등)을 **생성하거나 수정**했고, 해당 작업이 완료된 시점.

### 행동

응답 맨 마지막에 아래 한 줄 추가:

```
작업 완료 → `/ship`으로 커밋·푸시·PR을 한 번에 처리하세요.
```

### 적용 안 하는 경우

- 작업이 아직 진행 중 (테스트 실패, 추가 수정 필요)
- `.claude/`, `CLAUDE.md`, `progress.md`, `agent-plan.md` 등 메타 파일만 수정
- 분석·조사·질문 응답 (코드 변경 없음)
- 이미 `/ship` 또는 `/land`를 실행 중인 세션
- 파일 수정이 없는 git 작업 (commit, push, merge 등)
