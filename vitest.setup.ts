import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// O auto-cleanup do Testing Library depende de um `afterEach` global,
// que só existe com `test.globals: true` no vitest.config.ts — como
// preferimos não poluir o escopo global do app com os globals do
// Vitest, registramos aqui explicitamente.
afterEach(() => {
  cleanup();
});
