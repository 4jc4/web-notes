// Configuração do Orval para o frontend Notas.
//
// openapi/openapi.json não é editado nem versionado aqui — é sempre
// baixado por `npm run api:sync` (scripts/sync-openapi.mjs) a partir do
// release `openapi-latest` do api-notes antes de rodar o Orval. Ver
// docs/deployment.md.

import { defineConfig } from 'orval';

export default defineConfig({
  notesApi: {
    input: {
      target: './openapi/openapi.json',
    },

    output: {
      target: './src/generated/api/client.ts',
      schemas: './src/generated/api/models',
      client: 'fetch',
      clean: true,

      override: {
        mutator: {
          path: './src/lib/api/fetcher.ts',
          name: 'apiFetch',
        },
        // Nosso apiFetch devolve o corpo já parseado (Promise<T>), não
        // um wrapper { data, status, headers } — sem isso o Orval gera
        // tipos de retorno que não batem com o que o mutator realmente
        // devolve em runtime.
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
});
