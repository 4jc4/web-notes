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

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm run api:generate` — gera `src/generated/api/` a partir de `openapi/openapi.json`

## Deploy

Build e deploy passam por CI/CD (GitHub Actions → GHCR → self-hosted
runner), nunca por build manual em produção. Detalhes em
[`docs/deployment.md`](./docs/deployment.md) e
[`docs/infrastructure.md`](./docs/infrastructure.md).
