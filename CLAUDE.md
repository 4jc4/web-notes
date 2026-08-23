# CLAUDE.md

## Objetivo

Este arquivo contém instruções obrigatórias para agentes de IA que
trabalham neste repositório.

Antes de alterar código, autenticação, integração com API, Docker,
CI/CD ou arquitetura, leia as regras relevantes deste arquivo e a
documentação em `docs/`.

---

## Projeto

Frontend web da aplicação **Notas**.

Stack principal:

- Next.js
- React
- TypeScript
- Node.js 24
- OpenAPI
- Orval
- Docker
- GitHub Actions
- GHCR

Não presuma bibliotecas, scripts ou estruturas que não existam.
Inspecione o projeto antes de implementar alterações.

---

## Documentação

Consulte quando relevante:

- `docs/architecture.md` — arquitetura da aplicação;
- `docs/deployment.md` — CI/CD, build e deploy;
- `docs/infrastructure.md` — infraestrutura de produção;
- `docs/runbook.md` — diagnóstico e recuperação.

Alterações arquiteturais ou operacionais devem atualizar a documentação
correspondente.

---

## Arquitetura HTTP

Produção:

```text
https://notas.ajca.com.br
```

O navegador utiliza um único origin.

Roteamento público:

```text
/       → Next.js
/api/*  → API NestJS
```

Código executado no navegador deve consumir a API por caminhos relativos.

Exemplo:

```ts
fetch("/api/...");
```

Nunca usar no browser:

```text
http://192.168.x.x:xxxx
```

IPs e portas internas pertencem à infraestrutura e não ao código
client-side.

Nunca expor endereços internos por variáveis `NEXT_PUBLIC_*`.

O contrato OpenAPI descreve as rotas internas do NestJS (`/v1/*` e
`/health`). `src/lib/api/fetcher.ts` acrescenta `/api` no browser. Em
produção, o Nginx remove `/api` antes de encaminhar ao backend; em
desenvolvimento, o rewrite de `next.config.ts` reproduz exatamente
essa remoção. Não inserir `/api` de volta no código gerado.

---

## Contrato da API

A API NestJS é a fonte de verdade do contrato HTTP.

O contrato é definido em OpenAPI.

O frontend utiliza Orval para gerar automaticamente:

- tipos TypeScript;
- modelos;
- operações HTTP;
- cliente da API;
- demais artefatos configurados em `orval.config.ts`.

Não criar manualmente tipos ou clientes que possam ser derivados do
contrato OpenAPI.

---

## Orval

Orval é parte obrigatória da integração entre frontend e API.

Configuração:

```text
orval.config.ts
```

Código gerado:

```text
src/generated/api/
```

### Regra fundamental

Tudo dentro de:

```text
src/generated/api/
```

é código gerado.

Nunca editar esses arquivos manualmente.

Se algo estiver errado no código gerado, corrija:

- o contrato OpenAPI;
- `orval.config.ts`;
- o cliente/mutator customizado, quando aplicável;
- ou a API.

Depois execute novamente a geração.

Nunca corrigir diretamente o arquivo gerado.

---

## DTOs e tipos

Não duplicar manualmente DTOs existentes no contrato OpenAPI.

Evitar:

```ts
interface User {
  id: string;
  email: string;
}
```

se `User` já for gerado pelo Orval.

Prefira importar o tipo gerado.

Tipos exclusivamente relacionados à apresentação do frontend podem
continuar sendo definidos pelo frontend.

Exemplos:

- estado de componente;
- estado de formulário puramente visual;
- propriedades de componentes;
- view models específicos da interface.

---

## Mudanças no contrato

Quando a API mudar:

```text
API
 │
 ▼
OpenAPI
 │
 ▼
Orval
 │
 ▼
src/generated/api/
 │
 ▼
Frontend
```

O processo correto é:

1. atualizar o contrato OpenAPI;
2. executar a geração do Orval;
3. revisar o diff;
4. corrigir consumidores incompatíveis;
5. executar lint;
6. executar testes;
7. executar build.

Não contornar incompatibilidades usando:

- `any`;
- `@ts-ignore`;
- casts arbitrários;
- DTOs duplicados.

---

## Código gerado vs. código manual

> Nota de status (2026-08-22): `src/generated/api`, `src/lib/api`,
> `src/features` e `src/components` já existem e estão em uso (Orval
> integrado). O App Router, porém, continua em `app/` na raiz — **não**
> em `src/app/`; migrar as rotas para dentro de `src/` é uma decisão
> separada, ainda não tomada. Consulte a estrutura real do repositório
> antes de presumir um caminho.

Manter separação clara:

```text
src/
├── generated/
│   └── api/          # gerado pelo Orval
│
├── lib/
│   └── api/           # infraestrutura/adaptações próprias
│
├── features/
├── components/
└── app/
```

Não colocar código manual dentro de `src/generated/`.

---

## Autenticação

A autenticação utiliza sessão por cookie.

Não introduzir:

- JWT para autenticação do frontend;
- Bearer Token;
- access token;
- refresh token;
- autenticação via localStorage;
- autenticação via sessionStorage.

A API é a fonte de verdade da sessão.

O cliente HTTP utilizado pelo Orval deve preservar cookies quando
necessário.

Não alterar a arquitetura de autenticação através da configuração do
cliente gerado.

---

## Cliente HTTP

O comportamento HTTP comum deve ser centralizado.

Quando necessário, utilizar um cliente/mutator customizado para o Orval.

Responsabilidades possíveis:

- `credentials: 'include'`;
- tratamento uniforme de erros;
- headers comuns;
- parsing de resposta;
- integração com cancelamento de requests.

Não implementar autenticação paralela no cliente HTTP.

Não inserir Bearer Token.

---

## Browser vs. servidor Next.js

Sempre distinguir código executado:

- no navegador;
- no servidor Next.js.

Código client-side:

```text
/api/...
```

Não conhece IPs internos.

Código exclusivamente server-side pode usar uma URL interna quando
houver justificativa arquitetural, desde que seja configurada por
variável privada.

Nunca colocar secrets ou endereços internos sensíveis em:

```text
NEXT_PUBLIC_*
```

---

## Segurança

Nunca:

- commitar secrets;
- commitar `.env` de produção;
- armazenar senhas;
- registrar cookies de sessão;
- registrar credenciais;
- expor `SESSION_SECRET`;
- desabilitar TLS;
- adicionar CORS sem necessidade;
- inserir credenciais hardcoded;
- inserir IPs internos em código client-side.

Variáveis `NEXT_PUBLIC_*` devem ser consideradas públicas.

---

## TypeScript

Manter TypeScript estrito.

Evitar:

- `any`;
- `@ts-ignore`;
- casts desnecessários;
- tipos duplicados do OpenAPI.

Tipos de domínio fornecidos pela API devem preferencialmente vir do
código gerado pelo Orval.

---

## Dependências

Antes de adicionar uma dependência:

- verifique se a stack existente resolve o problema;
- avalie sua necessidade;
- evite abstrações desnecessárias.

Não substituir Orval por outro gerador de cliente sem decisão
arquitetural explícita.

---

## CI/CD

A branch `main` é protegida.

Alterações chegam por Pull Request e devem passar pelo CI.

Produção utiliza:

- Docker;
- `linux/arm64`;
- GHCR;
- imagem identificada pelo commit SHA;
- deploy automatizado.

O host de produção é runtime.

Não executar nele:

- `git pull`
- `npm install`
- `npm run build`
- `docker build`

Estado validado em 2026-08-23:

- release ARM64 e deploy do frontend concluindo automaticamente;
- runner dedicado `lxc-runner-web` ativo no LXC 103;
- container `app-frontend-1` saudável no LXC 105;
- Nginx publicando o frontend em `/` e a API em `/api/*`;
- `/login` e `/api/health` respondendo em produção.

---

## Validação

Antes de concluir uma alteração, execute os scripts existentes no
`package.json`.

Incluindo, quando disponíveis:

- `npm run api:generate`
- `npm run lint`
- `npm test`
- `npm run build`

Mudanças que afetem o contrato da API devem obrigatoriamente validar
novamente a geração do Orval.

---

## Decisões arquiteturais protegidas

Preservar:

- `notas.ajca.com.br` como hostname público;
- frontend em `/`;
- API em `/api`;
- same-origin;
- sessão por cookie;
- OpenAPI como contrato da API;
- Orval para geração do cliente;
- código gerado separado do código manual;
- Docker ARM64;
- GHCR;
- CI/CD;
- host de produção sem clone Git.

Se uma tarefa exigir mudar uma dessas decisões, explique o impacto
arquitetural antes de implementar.
