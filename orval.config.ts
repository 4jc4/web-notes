// Configuração do Orval para o frontend Notas.
//
// Status (2026-08-22): funcional. openapi/openapi.json é, por ora, uma
// cópia manual de api-notes/openapi/openapi.json (gerado lá por
// `npm run openapi:generate`) — a distribuição formal desse contrato
// entre os dois repositórios (commit com script de sync, artifact de
// CI, pacote publicado) ainda é uma decisão em aberto (ver
// docs/deployment.md). Até essa decisão, regenerar o cliente exige
// copiar o arquivo manualmente de novo.

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
