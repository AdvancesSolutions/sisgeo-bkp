FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init python3 make g++ && rm -rf /var/lib/apt/lists/*
RUN ln -s /usr/bin/dumb-init /sbin/dumb-init || true
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm --filter @sigeo/shared build
RUN pnpm --filter @sigeo/api build
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "node src/db/run-migrations.mjs && exec node dist/main.js"]
