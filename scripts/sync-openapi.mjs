// Baixa o contrato OpenAPI publicado pelo api-notes e salva em
// openapi/openapi.json (gitignored — é sempre buscado de novo, nunca
// versionado aqui).
//
// Fonte: o asset `openapi.json` do release `openapi-latest` do
// api-notes, publicado automaticamente pelo job "Publish OpenAPI
// contract" em .github/workflows/release.yml daquele repositório a
// cada push em main. api-notes é público, então isso não exige
// autenticação nem acesso a uma API rodando — é só um download HTTP de
// um artefato versionado (ver docs/deployment.md).
//
// Uso: npm run api:sync (ou, encadeado, npm run api:generate)

import { mkdir, writeFile } from "node:fs/promises";

const OPENAPI_URL =
  "https://github.com/4jc4/api-notes/releases/download/openapi-latest/openapi.json";

async function main() {
  const response = await fetch(OPENAPI_URL);

  if (!response.ok) {
    throw new Error(
      `Falha ao baixar o contrato OpenAPI de ${OPENAPI_URL}: HTTP ${response.status}`,
    );
  }

  const body = await response.text();

  await mkdir("openapi", { recursive: true });
  await writeFile("openapi/openapi.json", body);

  console.log(
    `✅ openapi/openapi.json atualizado a partir do release openapi-latest do api-notes.`,
  );
}

main().catch((error) => {
  console.error("❌", error.message);
  process.exitCode = 1;
});
