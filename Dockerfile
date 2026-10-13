# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S swap && adduser -S swap -G swap
COPY --from=build --chown=swap:swap /app/.next/standalone ./
COPY --from=build --chown=swap:swap /app/.next/static ./.next/static
COPY --from=build --chown=swap:swap /app/public ./public
RUN mkdir -p storage && chown swap:swap storage
USER swap
EXPOSE 3000
CMD ["node", "server.js"]

# Release step: docker build --target migrate -t swap-migrate . && docker run --rm -e DATABASE_URL=... swap-migrate
FROM deps AS migrate
COPY drizzle ./drizzle
COPY scripts/migrate.mjs ./scripts/migrate.mjs
CMD ["node", "scripts/migrate.mjs"]
