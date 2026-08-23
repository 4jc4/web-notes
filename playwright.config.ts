import { defineConfig, devices } from "@playwright/test";

// Pré-requisito, sempre: a API (api-notes) precisa estar rodando e
// alcançável via o proxy de /api/* deste app (ver next.config.ts /
// API_PROXY_TARGET), com o usuário semeado alice@example.com /
// senha123 (prisma/seed.ts do api-notes). Este config não sobe nem a
// API nem este frontend — no CI isso é feito explicitamente em
// .github/workflows/ci.yml; localmente, suba os dois com
// `npm run dev` (aqui) e `npm run start:dev` (api-notes) antes de
// rodar `npm run test:e2e`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
