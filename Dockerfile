FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts: husky 등 lifecycle 스킵 (devDep 없는 환경에서 실패 방지)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prisma generate: DATABASE_URL 검증이 빌드 시 실행되므로 더미 URL 필요
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma generate
RUN pnpm build

# ─── Stage 3: production ──────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

# 시작 전 DB 마이그레이션 실행 후 앱 기동
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
