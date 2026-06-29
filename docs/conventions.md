# 네이밍 컨벤션

## 변수

```typescript
const isLoading = true            // Boolean: is/has/can prefix 필수
const friends = ['Bob']           // 복수형
const DAILY_FREE_LIMIT = 20       // 비즈니스 상수: UPPER_SNAKE_CASE
const maxRetry = 3                // 로컬 임시 상수: camelCase
```

## 함수 — A/HC/LC 패턴

`prefix? + action + HighContext + LowContext?`

```typescript
getUser()              // action + HighContext
getUserMessages()      // action + HighContext + LowContext
shouldDisplayCard()    // prefix + action + Context
isPaymentEnabled()     // prefix + action + Context
```

## 클래스 멤버 선언 순서

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

## DTO

```typescript
class CreateUserDto {}      // 요청: 동사 + Entity + Dto
class UserResponseDto {}    // 응답: Entity + ResponseDto
```

## 이벤트

```typescript
class UserCreatedEvent {}
class MemorySavedEvent {}
```

---

## 금지 목록

```typescript
// ❌ any 타입 → unknown + 타입 가드로 대체
// ❌ as Type 강제 캐스팅 → 타입 가드로 대체
// ❌ 빈 catch {} → 반드시 로깅 또는 rethrow
// ❌ 중첩 3단계 이상 → guard clause 또는 메서드 추출
// ❌ 모듈 레벨 함수 → private 메서드로
// ❌ let result 암묵적 any → .catch() 체이닝으로 const 사용
// ❌ for...in 루프 → for...of 또는 Object.entries()
```

## 중첩 깊이 — 최대 2단계

```typescript
// ❌
if (user) {
  if (user.isActive) {
    if (plan === 'pro') { doWork() }
  }
}

// ✅ guard clause
if (!user || !user.isActive || plan !== 'pro') return
doWork()
```

## 함수 바디 가독성

statement 사이에 빈 줄 한 칸:

```typescript
// ✅
const user = await this.userRepository.findById(userId)

await this.cache.del(CACHE_KEYS.user(userId))

return user

// ❌ 따닥따닥 붙여쓰기
const user = await this.userRepository.findById(userId)
await this.cache.del(CACHE_KEYS.user(userId))
return user
```

## 중첩 try-catch 금지

부가 작업(캐시 삭제 등)은 `.catch()` 체이닝으로 분리:

```typescript
// ❌
try {
  const data = await this.repository.findOne(id)
  try {
    await this.cache.del(key)
  } catch (err) { this.logger.warn('cache del failed', err) }
} catch (err) { throw err }

// ✅
const data = await this.repository.findOne(id)
await this.cache.del(key).catch((err: unknown) => {
  this.logger.warn('cache del 실패 — TTL 만료 후 자동 소멸', err)
})
```

## 상수 관리

Redis 캐시 키는 `CACHE_KEYS` 상수로, Queue job name은 `queue.constants`로 관리:

```typescript
// ❌ magic string 직접 사용
return `user:${userId}`
await this.queue.add('send', payload)

// ✅
return CACHE_KEYS.user(userId)
await this.queue.add(ALERT_DISPATCH_JOB, payload)
```
