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
    "api:generate": "orval --config orval.config.ts"
  }
}
```

O código gerado fica em:

```text
src/generated/api/
```

> Status atual: `orval` está instalado e `npm run api:generate`
> funciona. O que falta é a distribuição formal do `openapi.json` — ver
> nota logo abaixo.

---

## Fonte OpenAPI

A geração deve utilizar um contrato OpenAPI controlado e reproduzível.

O pipeline não deve depender silenciosamente de uma API de produção
estar disponível.

Preferir um artefato OpenAPI fornecido/versionado pelo backend.

A estratégia exata de distribuição do `openapi.json` deve permanecer
documentada neste arquivo quando implementada.

> Decisão em aberto: como o `openapi.json` gerado pelo `api-notes`
> (`npm run openapi:generate` lá, ver `docs/runbook.md`) chega até este
> repositório (commit versionado vs. artefato/package publicado). Por
> ora é uma **cópia manual** para `openapi/openapi.json` (gitignored) —
> suficiente para desenvolvimento local, mas não para CI/deploy. Regerar
> o cliente hoje exige copiar o arquivo de novo à mão.

---

## CI de Pull Request

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
ghcr.io/4jc4/<frontend>:<commit-sha>
```

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
