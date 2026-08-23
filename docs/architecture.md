# Arquitetura — Notas

## Visão geral

A aplicação Notas utiliza:

- Next.js no frontend;
- NestJS na API;
- PostgreSQL;
- OpenAPI como contrato HTTP;
- Orval para geração do cliente TypeScript.

Para o navegador existe um único origin:

```text
https://notas.ajca.com.br
```

Roteamento:

```text
/       → Next.js
/api/*  → NestJS
```

---

## Arquitetura de produção

```text
                         INTERNET
                            │
                            ▼
                   notas.ajca.com.br
                            │
                            ▼
                       Cloudflare
                            │
                            ▼
                    Cloudflare Tunnel
                            │
                            ▼
                    LXC 104 — Nginx
                            │
                  ┌─────────┴─────────┐
                  │                   │
                  │ /                 │ /api/*
                  ▼                   ▼
           LXC 105 — Next.js    LXC 102 — NestJS
                                      │
                                      ▼
                               LXC 101 — PostgreSQL
```

Endereçamento interno:

| VMID | Serviço                | IP             |
| ---: | ---------------------- | -------------- |
|  101 | PostgreSQL             | `192.168.1.30` |
|  102 | NestJS                 | `192.168.1.31` |
|  103 | GitHub Actions runners | `192.168.1.32` |
|  104 | Nginx / proxy          | `192.168.1.33` |
|  105 | Next.js                | `192.168.1.34` |

O Cloudflare Tunnel fornece a entrada pública. O Nginx é a fronteira
de roteamento da aplicação.

---

## Contrato entre frontend e API

A API é dona do contrato HTTP.

O contrato é descrito utilizando OpenAPI.

O frontend não mantém manualmente uma segunda definição dos DTOs da API.

Fluxo:

```text
NestJS
   │
   ▼
OpenAPI
   │
   ▼
openapi.json
   │
   ▼
Orval
   │
   ├── tipos TypeScript
   ├── modelos
   └── cliente HTTP
   │
   ▼
src/generated/api/
   │
   ▼
Frontend Next.js
```

Isso reduz divergências entre frontend e backend.

---

## Fonte de verdade

A hierarquia é:

```text
API / DTOs
     │
     ▼
OpenAPI
     │
     ▼
Orval
     │
     ▼
Frontend
```

O frontend não deve redefinir manualmente o contrato.

Quando houver divergência, investigar a origem no contrato da API em vez
de corrigir o código gerado.

---

## Código gerado

O código gerado fica isolado:

```text
src/generated/api/
```

Esse diretório é propriedade do processo de geração.

Não editar manualmente.

Código próprio deve ficar fora dele.

Exemplo:

```text
src/
├── generated/
│   └── api/
├── lib/
│   └── api/
├── features/
├── components/
└── app/
```

> Estrutura-alvo parcialmente implementada: `src/generated`, `src/lib`,
> `src/features` e `src/components` já existem. O App Router continua
> em `app/` na raiz, não em `src/app/` — migrar rotas para dentro de
> `src/` é uma decisão separada, ainda não tomada. Ver nota de status em
> `CLAUDE.md`.

---

## Cliente HTTP

Orval gera a interface de comunicação com a API.

Comportamentos específicos da aplicação podem ser centralizados em um
cliente/mutator próprio.

Exemplos:

- envio de cookies;
- tratamento uniforme de erros;
- configuração do base path;
- cancelamento.

O cliente não deve introduzir JWT ou Bearer Token.

O contrato gerado contém caminhos internos, por exemplo
`/v1/notes`. O mutator `src/lib/api/fetcher.ts` converte esse caminho
para `/api/v1/notes` no browser. O Nginx remove `/api` ao encaminhar à
API. O rewrite de desenvolvimento em `next.config.ts` mantém a mesma
semântica.

---

## Same-origin

O navegador acessa:

```text
https://notas.ajca.com.br/
https://notas.ajca.com.br/api/...
```

Portanto, chamadas client-side devem utilizar `/api`.

Isso:

- simplifica cookies;
- evita exposição da topologia interna;
- reduz necessidade de CORS;
- mantém frontend e API no mesmo origin.

---

## Autenticação

A autenticação utiliza sessão por cookie.

Fluxo:

```text
Browser
   │
   ▼
/api/v1/auth/...
   │
   ▼
NestJS
   │
   ├── valida usuário
   ├── cria sessão
   │
   ▼
PostgreSQL
   │
   ▼
Set-Cookie
   │
   ▼
Browser
```

O cliente gerado deve respeitar essa arquitetura.

O cookie de sessão é `HttpOnly`; o frontend não lê nem persiste tokens.
As chamadas usam `credentials: 'include'`.

---

## Runtime e deploy

O frontend roda como `app-frontend-1` no LXC 105, porta 3000, por
Docker Compose. A imagem é `linux/arm64`, publicada no GHCR com a tag do
commit SHA. O runner dedicado em LXC 103 executa o deploy por SSH e
exige healthcheck saudável antes de concluir o release.

Produção não mantém clone Git e não executa Orval, `npm ci`, build do
Next.js ou Docker build.

---

## Alteração de contrato

Uma alteração de contrato segue:

```text
Alteração no backend
        │
        ▼
OpenAPI atualizado
        │
        ▼
Orval executado
        │
        ▼
Diff do código gerado
        │
        ▼
Correção dos consumidores
        │
        ▼
CI
```

Breaking changes devem aparecer como erros de compilação ou testes sempre
que possível.

Esse comportamento é desejável.

Não mascarar breaking changes com `any`.
