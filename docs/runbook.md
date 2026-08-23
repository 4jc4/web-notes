# Runbook — Frontend Notas

## Objetivo

Procedimentos para diagnóstico e recuperação.

---

## 1. Orval falha ao gerar

Execute:

```bash
npm run api:generate
```

Leia o primeiro erro real apresentado pelo Orval.

Investigue, nesta ordem:

1. contrato OpenAPI disponível;
2. contrato OpenAPI válido;
3. configuração `orval.config.ts`;
4. versão do Orval;
5. cliente/mutator customizado;
6. permissões de escrita no diretório gerado.

Não editar o código gerado para corrigir o problema.

---

## 2. OpenAPI incompatível

Se a geração falhar após mudança no backend:

1. identifique a operação ou schema afetado;
2. confira o OpenAPI produzido pela API;
3. confirme se a mudança foi intencional;
4. gere novamente;
5. corrija o frontend consumidor.

Fluxo:

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
Frontend
```

Corrigir o problema na camada onde ele foi introduzido.

---

## 3. Build quebra após `api:generate`

Isso normalmente indica que o contrato mudou e algum consumidor ainda
espera o contrato antigo.

Não resolver com:

```ts
any
```

ou:

```ts
// @ts-ignore
```

Localize os consumidores do tipo ou operação modificada e adapte-os ao
novo contrato.

---

## 4. Código gerado foi alterado manualmente

Descartar a alteração manual.

Execute novamente:

```bash
npm run api:generate
```

Se a alteração desaparecer, ela não deveria ter sido feita no arquivo
gerado.

Corrija `orval.config.ts`, o contrato OpenAPI ou código manual de
adaptação.

---

## 5. Cliente chama URL errada

No browser, as requisições devem utilizar:

```text
/api/...
```

Se aparecer:

```text
http://192.168.x.x
```

no DevTools do navegador, há erro de configuração.

Verifique:

1. `orval.config.ts`;
2. mutator/cliente HTTP;
3. variáveis `NEXT_PUBLIC_*`;
4. configuração do base path.

Não exponha IP interno como correção.

---

## 6. Cookie não é enviado

Verifique primeiro a requisição no DevTools.

Confirme:

1. chamada para `/api/...`;
2. same-origin;
3. configuração de `credentials`;
4. atributos do cookie;
5. resposta do endpoint de login.

Não introduza Bearer Token como workaround.

---

## 7. Erro 401

HTTP 401 deve ser tratado como problema de autenticação/sessão.

Investigue:

1. sessão criada;
2. cookie recebido;
3. cookie enviado;
4. sessão existente na API;
5. expiração.

Não interpretar automaticamente como problema do Orval.

---

## 8. Erro 403

HTTP 403 normalmente significa que a identidade foi reconhecida, mas a
operação não foi autorizada.

Não alterar o cliente gerado para contornar autorização.

---

## 9. Frontend indisponível

No Proxmox:

```bash
pct status 105
```

Verificar containers:

```bash
pct exec 105 -- docker ps
```

Dentro do host:

```bash
cd /opt/app
docker compose ps
docker compose logs --tail=100
```

---

## 10. Runner offline

No LXC 103:

```bash
systemctl status \
  actions.runner.4jc4-api-notes.lxc-runner.service \
  --no-pager -l
```

Logs:

```bash
journalctl \
  -u actions.runner.4jc4-api-notes.lxc-runner.service \
  -n 100 \
  --no-pager
```

Estado saudável deve apresentar mensagens equivalentes a:

```text
Connected to GitHub
Listening for Jobs
```

`active (running)` sozinho não garante conexão com o GitHub.

---

## 11. Testar SSH Runner → Frontend

No LXC 103:

```bash
sudo -u runner ssh \
  -o BatchMode=yes \
  -o ConnectTimeout=5 \
  deploy@192.168.1.34 \
  'hostname && whoami && docker version'
```

---

## 12. API

Teste público:

```bash
curl -i https://notas.ajca.com.br/api/health
```

Se a API estiver saudável mas o frontend não, investigue o frontend e
o roteamento `/`.

---

## 13. Diagnóstico por camadas

Investigue:

```text
Next.js
   │
   ▼
Docker
   │
   ▼
LXC 105
   │
   ▼
Nginx
   │
   ▼
Cloudflare Tunnel
   │
   ▼
Cloudflare
```

Para problemas de contrato:

```text
NestJS
   │
   ▼
OpenAPI
   │
   ▼
Orval
   │
   ▼
TypeScript
   │
   ▼
Frontend
```

Não alterar várias camadas simultaneamente.

---

## 14. Deploy falhou

Use:

```bash
gh run list
```

Depois:

```bash
gh run view <RUN_ID>
```

E:

```bash
gh run view <RUN_ID> --log-failed
```

Identifique primeiro a etapa:

1. OpenAPI
2. Orval
3. CI
4. Build
5. Publish
6. Deploy
7. Healthcheck

antes de modificar infraestrutura.

---

## 15. Não fazer

Durante troubleshooting, não:

- editar `src/generated/api/`;
- introduzir `any` para esconder breaking changes;
- criar DTO duplicado para contornar OpenAPI;
- colocar IP interno no browser;
- introduzir JWT para resolver cookie;
- apagar volumes sem avaliar impacto;
- colocar secrets em logs;
- editar aplicação dentro do container;
- executar build manual em produção.
