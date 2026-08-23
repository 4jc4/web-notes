# Deployment — Frontend Notas

## Princípio

Produção executa artefatos já validados.

O LXC de produção não:

- gera cliente Orval;
- baixa OpenAPI;
- executa `npm install`;
- compila Next.js;
- executa Docker build.

Tudo isso acontece antes do deployment.

---

## Pipeline conceitual

```text
API
 │
 ▼
OpenAPI
 │
 ▼
Frontend
 │
 ├── Orval
 │
 ├── lint
 │
 ├── testes
 │
 └── build
 │
 ▼
Docker Buildx
 │
 ▼
GHCR
 │
 ▼
LXC 105
```

---

## Geração do cliente

O cliente da API é gerado através de:

```bash
npm run api:generate
```

O script deve executar Orval utilizando:

```text
orval.config.ts
```

Exemplo de script:

```json
{
  "scripts": {
    "api:sync": "node scripts/sync-openapi.mjs",
    "api:generate": "npm run api:sync && orval --config orval.config.ts"
  }
}
```

`api:sync` (`scripts/sync-openapi.mjs`) baixa `openapi/openapi.json` do
release `openapi-latest` do `api-notes` antes de `orval` rodar —
`api:generate` sempre parte do contrato mais recente publicado, nunca
de uma cópia manual.

O código gerado fica em:

```text
src/generated/api/
```

---

## Fonte OpenAPI

A geração deve utilizar um contrato OpenAPI controlado e reproduzível.

O pipeline não deve depender silenciosamente de uma API de produção
estar disponível.

**Decisão tomada:** o `api-notes` publica `openapi.json` como asset de
uma GitHub Release (`openapi-latest`, atualizada a cada push em `main`
pelo job `publish-openapi` em `.github/workflows/release.yml` daquele
repositório — ver `docs/deployment.md` do `api-notes`). O `web-notes`
busca esse artefato por HTTP simples:

```text
api-notes (push em main)
        │
        ▼
npm run openapi:generate
        │
        ▼
GitHub Release "openapi-latest"
   (asset openapi.json)
        │
        ▼
web-notes: npm run api:sync
        │
        ▼
openapi/openapi.json (local, gitignored)
        │
        ▼
orval
        │
        ▼
src/generated/api/
```

Como `api-notes` é público, o download não exige autenticação nem
depende de a API de produção estar no ar — é só um artefato versionado
por release, igual a um build artifact. `openapi-latest` é uma tag
"móvel" (sempre reaponta pro commit mais recente de `main`); não há
ainda como pinar uma versão específica do contrato — se isso for
necessário no futuro, é uma extensão natural (tag por commit SHA).

---

## CI de Pull Request

> Status: implementado em `.github/workflows/ci.yml`, seguindo
> exatamente este fluxo.

O Pull Request deve validar:

```text
Checkout
   │
   ▼
npm ci
   │
   ▼
OpenAPI disponível
   │
   ▼
npm run api:generate
   │
   ▼
verificação do código gerado
   │
   ▼
lint
   │
   ▼
testes
   │
   ▼
build
```

O workflow atual separa essas verificações em três checks: título da
PR, `Lint & Build` e E2E com login/CRUD contra uma API e PostgreSQL
reais do ambiente de CI.

---

## Detecção de código gerado desatualizado

O CI deve impedir que o frontend seja aprovado com cliente incompatível
com o contrato utilizado pelo projeto.

Uma estratégia possível é:

```bash
npm run api:generate
git diff --exit-code
```

Isso é apropriado quando os arquivos gerados são versionados no
repositório.

Se a estratégia escolhida posteriormente for não versionar os arquivos
gerados, o CI deverá gerar o cliente antes do build.

Não misturar as duas estratégias sem decisão explícita.

> Decisão tomada: os arquivos gerados (`src/generated/`) **são
> versionados** no repositório. O job `build` de `ci.yml` roda
> `npm run api:sync` + `orval` e falha com `git diff --exit-code` se o
> resultado divergir do que está commitado — pega tanto "esqueci de
> regenerar" quanto "o contrato mudou no api-notes e ninguém notou".

---

## Build da imagem

Após validação:

```text
Docker Buildx
      │
      ▼
linux/arm64
      │
      ▼
GHCR
```

A imagem deve ser identificada pelo SHA do commit.

Exemplo conceitual:

```text
ghcr.io/4jc4/web-notes:<commit-sha>
```

> Status: implementado em `.github/workflows/release.yml` (job
> `build`), `Dockerfile` e `.dockerignore`. Builda e publica no GHCR a
> cada push em `main`, sem depender de runner self-hosted. Testado
> localmente (`docker build` + `docker compose up`, healthcheck fica
> `healthy`).

---

## Deploy

Depois do merge em `main`:

1. validar o código;
2. gerar/validar cliente OpenAPI;
3. construir aplicação;
4. construir imagem ARM64;
5. publicar no GHCR;
6. self-hosted runner conecta ao LXC 105;
7. host baixa a imagem;
8. container é recriado;
9. healthcheck é executado.

> Status: fluxo completo provisionado e validado em 2026-08-23. O
> runner dedicado `lxc-runner-web` executa no LXC 103, envia o Compose
> ao `/opt/app` do LXC 105, implanta a imagem ARM64 e confirma o
> healthcheck antes de concluir o release. Ver `docs/runbook.md` para
> reconstrução e recuperação.

O runner utilizado é o serviço
`actions.runner.4jc4-web-notes.lxc-runner-web.service` no LXC 103. Ele
acessa `deploy@192.168.1.34`, mantém `/opt/app/docker-compose.yml`, faz
login efêmero no GHCR, aplica `IMAGE_TAG=${{ github.sha }}` e aceita
resposta `200` ou `307` no healthcheck da raiz.

---

## Produção

O LXC 105 deve receber a imagem pronta.

Não executar em produção:

- `npm run api:generate`
- `npm ci`
- `npm run build`
- `git pull`
- `docker build`

---

## Alteração da API

Quando o contrato da API mudar:

```text
Backend
   │
   ▼
OpenAPI atualizado
   │
   ▼
Frontend gera novamente
   │
   ▼
TypeScript identifica incompatibilidades
   │
   ▼
Frontend é corrigido
   │
   ▼
CI
   │
   ▼
Deploy
```

Não corrigir incompatibilidades diretamente em `src/generated/api/`.

---

## Rollback

Rollback utiliza uma imagem anterior conhecida como saudável.

Não gerar novamente o cliente da API no servidor durante rollback.

O artefato Docker deve conter exatamente a versão do frontend construída
e validada pelo CI.

Procedimento operacional:

```bash
ssh cardoso@192.168.1.24
sudo pct exec 105 -- sh -lc \
  'cd /opt/app && IMAGE_TAG=<sha-saudavel> docker compose pull frontend && IMAGE_TAG=<sha-saudavel> docker compose up -d frontend'
```

Depois, confirme `healthy`, `GET /login = 200` e que o backend continua
respondendo em `/api/health`.
