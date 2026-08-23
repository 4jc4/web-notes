# Infraestrutura — Notas

## Ambiente

A aplicação roda em containers LXC hospedados em Proxmox VE sobre
arquitetura ARM64.

---

## Inventário

| VMID | Hostname | Função                             | IP           |
| ---- | -------- | ---------------------------------- | ------------ |
| 101  | postgres | PostgreSQL                         | 192.168.1.30 |
| 102  | api      | NestJS / Docker                    | 192.168.1.31 |
| 103  | runner   | GitHub Actions self-hosted runners | 192.168.1.32 |
| 104  | proxy    | Nginx / Cloudflare Tunnel          | 192.168.1.33 |
| 105  | frontend | Next.js / Docker                   | 192.168.1.34 |

Atualizar esta tabela quando a infraestrutura mudar.

Host Proxmox:

```text
acesso:       cardoso@192.168.1.24
hostname:     pve
plataforma:   Raspberry Pi 4 / ARM64
Proxmox VE:   9
```

Ordem de boot:

```text
101 PostgreSQL → 102 API → 105 Frontend → 104 Proxy → 103 Runner
```

---

## Fluxo

```text
Internet
   │
   ▼
Cloudflare
   │
   ▼
Cloudflare Tunnel
   │
   ▼
LXC 104
Nginx
   │
   ├── /      → LXC 105
   │
   └── /api/* → LXC 102
                       │
                       ▼
                    LXC 101
                   PostgreSQL
```

---

## LXC 105 — Frontend

```text
VMID:         105
hostname:     frontend
IP:           192.168.1.34
gateway:      192.168.1.1
architecture: arm64
unprivileged: yes
```

O container executa Docker.

Usuário de deploy:

```text
deploy
```

Diretório operacional:

```text
/opt/app
```

Estrutura esperada:

```text
/opt/app/
└── docker-compose.yml
```

Não manter clone Git de produção nesse host.

> Status: provisionado em 2026-08-23. O LXC 105 possui `/opt/app`,
> usuário `deploy` no grupo Docker e chave SSH autorizada a partir do
> LXC 103. O runner dedicado `lxc-runner-web` executa no LXC 103 como o
> serviço systemd
> `actions.runner.4jc4-web-notes.lxc-runner-web.service`. O primeiro
> deploy automatizado concluiu com healthcheck saudável.

---

## LXC 102 — API

Executa a API NestJS em Docker.

O frontend não acessa diretamente seu endereço interno a partir do
browser.

A exposição pública ocorre através do reverse proxy:

```text
https://notas.ajca.com.br/api/
```

Container: `app-api-1`, porta 3000, healthcheck `/health`.

---

## LXC 103 — Runner

Executa o GitHub Actions self-hosted runner.

Responsabilidade:

```text
GitHub
   │
   ▼
Runner 103
   │
   ├── SSH → API
   └── SSH → Frontend
```

O runner é orquestrador, não host de aplicação.

Serviços ativos:

```text
actions.runner.4jc4-api-notes.lxc-runner.service
actions.runner.4jc4-web-notes.lxc-runner-web.service
```

---

## LXC 104 — Proxy

Responsável pelo reverse proxy.

Roteamento:

```text
/       → frontend
/api/*  → API
```

Também participa do caminho do Cloudflare Tunnel.

Configuração pública:

```text
/       → http://192.168.1.34:3000
/api/*  → http://192.168.1.31:3000/*
```

O proxy remove `/api`. Backup conhecido:

```text
/etc/nginx/backups/notas.ajca.com.br.bak-20260823
```

---

## Rede

Rede:

```text
192.168.1.0/24
```

Gateway:

```text
192.168.1.1
```

IPs internos são detalhes de infraestrutura.

Não devem aparecer em bundles JavaScript enviados ao navegador.

---

## Docker

Arquitetura de produção:

```text
linux/arm64
```

Registry:

```text
ghcr.io
```

As imagens devem ser identificáveis pelo commit SHA.

Containers esperados:

```text
LXC 102: app-api-1
LXC 105: app-frontend-1
```

Ambos devem permanecer `healthy`.

---

## Segredos

Nunca documentar valores reais de:

- senhas;
- tokens;
- `SESSION_SECRET`;
- credenciais PostgreSQL;
- tokens GitHub;
- credenciais Cloudflare;
- chaves SSH privadas.

Documentar somente nomes de variáveis quando necessário.

Pendências operacionais conhecidas: formalizar e testar backups de
PostgreSQL/LXCs e revisar a política de firewall do Proxmox.
