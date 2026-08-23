import type { NextConfig } from "next";

// Em produção, /api/* nunca chega ao Next.js — o Nginx já roteia
// diretamente para a API NestJS (ver docs/architecture.md). Este rewrite
// existe só para o dev server local, onde não há reverse proxy: sem
// ele, `fetch('/api/...')` feito pelo browser cairia no próprio
// Next.js e daria 404.
//
// API_PROXY_TARGET é uma variável privada (nunca NEXT_PUBLIC_*) lida
// aqui, no servidor Next.js — o browser nunca a vê. Aponte para onde a
// API NestJS estiver rodando localmente (ver api-notes/.env, PORT).
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Build de produção enxuto para a imagem Docker (ver Dockerfile) —
  // copia só o necessário pra rodar `node server.js`, sem o
  // node_modules completo.
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Espelha o Nginx de produção: `/api` é a fronteira pública e
        // não faz parte das rotas internas do NestJS.
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;
