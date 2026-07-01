# AEL Auth API

API de autenticação com NestJS, JWT, refresh tokens, Prisma ORM e Argon2id.

**Production:** https://nestjs-auth-ael.vercel.app  
**Swagger UI:** https://nestjs-auth-ael.vercel.app/docs

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Runtime | Node.js 26, TypeScript 5 |
| Framework | NestJS 11 |
| HTTP | Express 5 (via `@nestjs/platform-express`) |
| ORM | Prisma 6 |
| DB | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Hash | Argon2id |
| Deploy | Vercel (serverless functions) |

## Estrutura

```
src/
├── main.ts                  # Entrypoint local (ExpressAdapter)
├── app.module.ts            # Módulo raiz
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts   # Rotas /auth/*
│   ├── auth.service.ts      # Lógica de register, login, refresh, logout, me
│   ├── auth.dto.ts          # DTOs com @ApiProperty
│   └── jwt-auth.guard.ts    # Guard para rotas protegidas
├── prisma/
│   └── prisma.service.ts    # Singleton PrismaClient
└── config/
    └── constants.ts         # JWT_SECRET, JWT_EXPIRES_IN, etc.
api/
└── index.ts                 # Entrypoint Vercel (handler serverless)
```

## Fluxo de Autenticação

```
Register → POST /auth/register → { name, email, password }
                                    ↓
                              Argon2id hash
                                    ↓
                              Salva no DB via Prisma
                                    ↓
                              Retorna UserResponseDto

Login → POST /auth/login → { email, password }
                              ↓
                        Verifica hash Argon2id
                              ↓
                        Gera accessToken (15min) + refreshToken (7d)
                              ↓
                        Salva refreshToken no DB
                              ↓
                        Retorna AuthTokensDto

Refresh → POST /auth/refresh → { refreshToken }
                                ↓
                          Verifica no DB + JWT verify
                                ↓
                          Gera novo accessToken
                                ↓
                          Retorna AccessTokenDto

Logout → POST /auth/logout → { refreshToken }
                              ↓
                        Deleta refreshToken do DB
                              ↓
                        Retorna LogoutResponseDto

Me → GET /auth/me → Bearer Token (Authorization header)
                     ↓
               JwtAuthGuard decodifica token
                     ↓
               Busca user no DB
                     ↓
               Retorna UserResponseDto
```

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Cria usuário |
| POST | `/auth/login` | — | Login, retorna tokens |
| POST | `/auth/refresh` | — | Renova access token |
| POST | `/auth/logout` | — | Revoga refresh token |
| GET | `/auth/me` | Bearer | Dados do usuário logado |
| GET | `/docs` | — | Swagger UI |

## Setup local

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cat > .env << EOF
DATABASE_URL="postgresql://..."
JWT_SECRET="sua-chave-secreta"
JWT_EXPIRES_IN="900"
JWT_REFRESH_SECRET="outra-chave-secreta"
JWT_REFRESH_EXPIRES_IN="604800"
EOF

# 3. Rodar migrations
npx prisma migrate dev

# 4. Iniciar dev
pnpm start:dev
```

## Desenvolvimento com Vercel

```bash
pnpm vercel dev
```

Usa `api/index.ts` como entrypoint serverless com cache da instância NestJS entre requisições (warm start).

## Deploy na Vercel

O projeto já está configurado em `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "api/**/*.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "api/index.ts" }]
}
```

O build roda `pnpm install` com `ignore-scripts=true` (via `.npmrc`) e `prisma generate` no script `vercel-build`.

**Variáveis de ambiente necessárias no Vercel:**
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`
- `ENABLE_EXPERIMENTAL_COREPACK=1` (para usar pnpm 11)

## DTOs

| DTO | Campos |
|-----|--------|
| `RegisterDto` | `name?`, `email`, `password` |
| `LoginDto` | `email`, `password` |
| `RefreshTokenDto` | `refreshToken` |
| `UserResponseDto` | `id`, `email`, `name?`, `access` |
| `AuthTokensDto` | `accessToken`, `refreshToken` |
| `AccessTokenDto` | `accessToken` |
| `LogoutResponseDto` | `message` |
