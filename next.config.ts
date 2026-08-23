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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
