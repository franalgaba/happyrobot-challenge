FROM oven/bun:1.3.11 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.11 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun --filter @happyrobot-challenge/api build
EXPOSE 3000
CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun apps/api/dist/index.js"]
