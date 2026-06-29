# 교체 포인트

## ORM — TypeORM으로 교체할 때

```bash
pnpm add @nestjs-cls/transactional-adapter-typeorm typeorm
```

변경되는 파일:

```
database/database.module.ts     TransactionalAdapterTypeOrm으로 교체
database/database.service.ts    DataSource로 교체
libs/common/repositories/
  base.repository.ts            BaseRepository 구현체 교체
각 도메인 repository             db 호출 방식 변경 (Prisma → typeorm)
```

변경 없는 파일 (그대로 동작):

```
@Transactional()                라이브러리 어댑터가 처리
AllExceptionFilter              Prisma 에러 블록만 제거
DomainException / SystemException
CacheModule
auth/ user/ (서비스·컨트롤러)
```

TypeORM 엔티티 예제 → `examples/typeorm/`

---

## OAuth Provider — Kakao 추가할 때

```typescript
// src/auth/strategies/kakao.strategy.ts 생성
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  async validate(accessToken: string, _: string, profile: any, done: VerifyCallback) { ... }
}
```

추가되는 파일:

```
auth/strategies/kakao.strategy.ts
config/kakao.config.ts
```

변경 없는 파일:

```
auth.service.ts
jwt.strategy.ts
refresh-token.repository.ts
```

`IProviderAdapter` 인터페이스(`src/auth/interfaces/provider-adapter.interface.ts`)를 구현하기만 하면 됩니다.
