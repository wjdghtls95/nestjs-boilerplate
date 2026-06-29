## Common Naming Convention
> 모든 앱 (server / web / mobile) 공통 적용

### 변수
- camelCase
- 단수/복수 값에 맞게: `friend = 'Bob'` / `friends = ['Bob']`
- Boolean: `is/has/can/should` prefix 필수
  ```ts
  const isLoading = true
  const hasMemory = false
  const canEdit = true
  ```

### 상수
- 비즈니스 의미 있는 상수: `UPPER_SNAKE_CASE`
  ```ts
  const DAILY_FREE_LIMIT = 20
  const ACCESS_TOKEN_EXPIRY = 15 * 60
  ```

- 로컬 임시 상수: `camelCase`
  ```ts
  const maxRetry = 3
  ```

### 함수 — A/HC/LC 패턴
`prefix? + action + highContext + lowContext?`

| 예시 | prefix | action | HC | LC |
|------|--------|--------|----|----|
| `getUser` | — | get | User | — |
| `getUserMessages` | — | get | User | Messages |
| `shouldDisplayMessage` | should | Display | Message | — |
| `isPaymentEnabled` | is | Enabled | Payment | — |

### 클래스 / 타입 / 인터페이스
- PascalCase
- Interface `I` prefix 금지: `UserService` (not `IUserService`)

### Event
- `도메인 + 과거형 동사 + Event`
  ```ts
  class UserCreatedEvent {}
  class MemorySavedEvent {}
  ```

### 주석 정책
- 기본값: 주석 없음
- 허용: "이 코드가 이렇게 된 이유가 코드 밖에 있을 때만" 한 줄
- **언어: 한국어** — WHY 설명은 한국어가 더 명확함
  ```ts
  // Kakao는 email을 선택 제공이라 없을 수 있음
  const email = kakaoAccount.email ?? `kakao_${kakaoId}@jarvis.local`
  ```

- JSDoc: `packages/types`, `packages/ui` 공유 패키지에만

### Loop
- `for...in` 금지 (Object/Array 모두)
- 배열: `for...of` 또는 `.forEach()` / `.map()` / `.filter()`
- 객체: `Object.values()` / `Object.keys()` / `Object.entries()`

### 중첩 깊이 (max depth 2)

조건·루프 중첩 최대 2단계. 초과 시 guard clause 또는 함수 추출.

```typescript
// ❌
if (user) { if (user.isActive) { if (plan === 'pro') { doWork() } } }

// ✅ guard clause
if (!user || !user.isActive || plan !== 'pro') return
doWork()
```

### 타입 안전성

- `any` 금지 — `unknown` + 타입 가드 사용
- `!` non-null assertion 최소화 — 불가피하면 한 줄 주석으로 이유 명시
- `as Type` 강제 캐스팅 금지 — 타입 가드로 대체
- `let result` 암묵적 any 금지 — `.catch()` 체이닝으로 `const` 사용
  ```ts
  // ❌
  let result;
  try {
    result = await this.client.call(payload);
  } catch {
    return null;
  }

  // ✅
  const result = await this.client.call(payload).catch(() => null);
  ```

### 하드코딩 금지

| 값의 종류 | 넣는 곳 |
|-----------|--------|
| 환경마다 달라지는 값 | `.env` + config |
| 런타임 튜닝값 | config (`app.config.ts`) |
| 앱 전체 공유 고정 상수 | `libs/common/constants/` |
| 한 파일에서만 쓰는 상수 | 해당 파일 상단 `const` |

판단: "이 값이 바뀔 때 grep해야 하는가?" → YES면 추출.

### 함수 바디 가독성
- 함수 내 각 statement 사이 빈 줄 한 칸 추가
```ts
// ✅
const memory = await this.memoryRepository.findOneByUserIdAndId(userId, memoryId);

await this.inferenceClient.indexMemory({ ... });

return descriptor;

// ❌
const memory = await this.memoryRepository.findOneByUserIdAndId(userId, memoryId);
await this.inferenceClient.indexMemory({ ... });
return descriptor;
```
