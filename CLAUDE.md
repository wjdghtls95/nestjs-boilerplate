# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project

NestJS boilerplate with Auth, Cache, DI, and Claude Code rules baked in.
Designed to be cloned and used as a starting point for NestJS backend projects.

## Tech Stack

```
Server:  NestJS
DB:      PostgreSQL (Prisma ORM — swap point available)
Cache:   Redis (ioredis)
Auth:    JWT · Refresh Token Rotation · OAuth (IProviderAdapter pattern)
```

## Architecture

- `src/` — application source
- `libs/common/` — shared infrastructure (exceptions, filters, guards, repositories)
- `prisma/` — schema (User + Account + RefreshToken)
- `examples/typeorm/` — TypeORM entity equivalents for ORM swap reference

## Swap Points

**ORM swap:** `DatabaseModule.forRoot({ adapter: 'prisma' | 'typeorm' })`
- Change `database.module.ts` + `database.service.ts`
- Replace `prisma-base.repository.ts` with `typeorm-base.repository.ts`
- See `examples/typeorm/` for entity examples

**OAuth provider swap:** Implement `IProviderAdapter` interface
- Add `src/auth/strategies/<provider>.strategy.ts`
- Add `src/config/<provider>.config.ts`
- Register in `AuthModule`

## Rules

@.claude/rules/karpathy-guidelines.md
@.claude/rules/code-gen-protocol.md
@.claude/rules/code-consistency.md
@.claude/rules/conventions/common.md
@.claude/rules/conventions/server.md
@.claude/rules/conventions/git.md
@.claude/rules/ship-reminder.md
