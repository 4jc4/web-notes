import { describe, expect, it } from "vitest";
import { formatNoteDate } from "./format-date";

describe("formatNoteDate", () => {
  it("formata uma data ISO em pt-BR, com dia, mês, ano e hora", () => {
    const result = formatNoteDate("2026-03-15T14:30:00.000Z");

    expect(result).toContain("2026");
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
