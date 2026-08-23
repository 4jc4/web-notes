# Notas — frontend

Frontend web da aplicação **Notas** (Next.js + React + TypeScript),
consumindo a API NestJS (`api-notes`) via um cliente gerado pelo Orval a
partir do contrato OpenAPI.

Antes de mexer em autenticação, integração com a API, Docker ou CI/CD,
leia [`CLAUDE.md`](./CLAUDE.md) e a documentação em [`docs/`](./docs).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em [http://localhost:3000](http://localhost:3000).

O frontend espera a API NestJS (`api-notes`) rodando localmente — por
padrão em `http://localhost:3001` (ver `API_PROXY_TARGET` em
[`.env.example`](./.env.example) e o rewrite em
[`next.config.ts`](./next.config.ts), que existe só para o dev server;
em produção o Nginx já roteia `/api/*` direto para a API).

## Gerando o cliente da API

```bash
npm run api:generate
```

Isso baixa o contrato mais recente publicado pelo `api-notes` (release
`openapi-latest`, ver [`docs/deployment.md`](./docs/deployment.md)) e
roda o Orval em cima dele. Não precisa ter o `api-notes` clonado nem
rodando.

Nunca edite `src/generated/api/` manualmente — corrija o contrato
OpenAPI, `orval.config.ts` ou o mutator em `src/lib/api/fetcher.ts`, e
gere de novo.

## Testes

```bash
npm run test        # unitários/componente (Vitest + Testing Library)
npm run test:watch  # idem, em watch mode
npm run test:e2e    # e2e (Playwright) — exige api-notes rodando (ver abaixo)
```

Os testes e2e (`e2e/notes.spec.ts`) rodam contra a aplicação de verdade
— não fazem mock de nada. Antes de rodar `npm run test:e2e` localmente,
suba as duas pontas:

```bash
# num terminal, no repo api-notes (PORT=3001 — 3000 já é o deste
# frontend; API_PROXY_TARGET aqui já aponta pra 3001 por padrão):
docker compose -f docker-compose.dev.yml up -d
npx prisma migrate deploy && npx prisma db seed
PORT=3001 npm run start:dev

# noutro terminal, aqui:
npm run dev
```

O CI (`.github/workflows/ci.yml`, job `e2e`) faz isso automaticamente
a cada PR: sobe Postgres real, clona e roda o `api-notes` de verdade,
builda este frontend, e roda o Playwright contra os dois.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm run test` — testes unitários/componente
- `npm run test:e2e` — testes e2e (Playwright)
- `npm run api:generate` — gera `src/generated/api/` a partir de `openapi/openapi.json`

## Deploy

Build e deploy passam por CI/CD (GitHub Actions → GHCR → self-hosted
runner), nunca por build manual em produção. Detalhes em
[`docs/deployment.md`](./docs/deployment.md) e
[`docs/infrastructure.md`](./docs/infrastructure.md).
