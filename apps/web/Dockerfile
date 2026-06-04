FROM oven/bun:1.3.11 AS builder
WORKDIR /app

COPY package.json bun.lock tsconfig.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN bun install --frozen-lockfile

COPY apps/web apps/web
COPY packages/shared packages/shared

ARG VITE_CLIENT_NAME=Acme Logistics

ENV VITE_CLIENT_NAME=${VITE_CLIENT_NAME}

RUN bun --filter @happyrobot-challenge/web build

FROM oven/bun:1.3.11 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV API_BASE_URL=http://api.railway.internal:3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/bff ./bff
COPY --from=builder /app/apps/web/server.mjs ./server.mjs

EXPOSE 8080

CMD ["bun", "server.mjs"]
