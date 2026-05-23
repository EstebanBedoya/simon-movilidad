FROM node:20-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copy workspace manifests for layer caching
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend

# Build — @simon/types only exports interfaces/types, erased at compile time
RUN pnpm --filter @simon/backend build

# Standalone production deployment with resolved prod deps
RUN pnpm --filter @simon/backend --prod deploy --legacy /deploy

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /deploy .
COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/main"]
