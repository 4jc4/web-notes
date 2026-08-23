# Infraestrutura — Notas

## Ambiente

A aplicação roda em containers LXC hospedados em Proxmox VE sobre
arquitetura ARM64.

---

## Inventário

| VMID | Hostname | Função | IP |
|------|----------|--------|----|
| 101 | postgres | PostgreSQL | rede interna |
| 102 | api | NestJS / Docker | 192.168.1.31 |
| 103 | runner | GitHub Actions self-hosted runner | rede interna |
| 104 | proxy | Nginx / Cloudflare Tunnel | rede interna |
| 105 | frontend | Next.js / Docker | 192.168.1.34 |

Atualizar esta tabela quando a infraestrutura mudar.

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
├── docker-compose.yml
└── .env
```

Não manter clone Git de produção nesse host.

---

## LXC 102 — API

Executa a API NestJS em Docker.

O frontend não acessa diretamente seu endereço interno a partir do
browser.

A exposição pública ocorre através do reverse proxy:

```text
https://notas.ajca.com.br/api/
```

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

---

## LXC 104 — Proxy

Responsável pelo reverse proxy.

Roteamento:

```text
/       → frontend
/api/*  → API
```

Também participa do caminho do Cloudflare Tunnel.

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
