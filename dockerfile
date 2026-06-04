# --- ESTÁGIO 1: BUILD ---
FROM node:24-slim AS builder

LABEL version="2.0.2"
LABEL description="API de Autenticação - AEL"

WORKDIR /app

ENV CI=true
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Injeta a variável MOCK para o prisma.config.ts rodar em paz no build offline
ENV DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"

RUN pnpm prisma generate
RUN pnpm run build

RUN pnpm prune --prod --ignore-scripts

# --- ESTÁGIO 2: PRODUÇÃO ---
FROM node:24-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

RUN chown -R node:node /app

COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 8080

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/main.js"]
