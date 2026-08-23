import { describe, expect, it } from "vitest";
import { ApiError } from "./fetcher";
import { friendlyErrorMessage } from "./friendly-error";

describe("friendlyErrorMessage", () => {
  it("devolve mensagem genérica em português para ApiError", () => {
    const error = new ApiError(500, undefined);
    expect(friendlyErrorMessage(error)).toBe(
      "Algo deu errado. Tente de novo em instantes.",
    );
  });

  it("devolve mensagem de conexão para falha de rede (TypeError)", () => {
    const error = new TypeError("Failed to fetch");
    expect(friendlyErrorMessage(error)).toBe(
      "Não foi possível conectar. Verifique sua conexão e tente de novo.",
    );
  });

  it("cai no fallback genérico para qualquer outro tipo de erro", () => {
    expect(friendlyErrorMessage("algo inesperado")).toBe(
      "Algo deu errado. Tente de novo em instantes.",
    );
    expect(friendlyErrorMessage(null)).toBe(
      "Algo deu errado. Tente de novo em instantes.",
    );
  });
});
