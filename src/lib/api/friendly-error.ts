import { ApiError } from "./fetcher";

// A API devolve mensagens de erro (RFC 7807) em inglês (ex.: "Invalid
// credentials") — não são o texto que mostramos na interface. Cada tela
// mapeia os status que sabe tratar para uma mensagem em português; isto
// aqui é só o fallback genérico para o que sobrar (erro de rede, 5xx,
// status inesperado).
export function friendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return "Algo deu errado. Tente de novo em instantes.";
  }
  if (error instanceof TypeError) {
    return "Não foi possível conectar. Verifique sua conexão e tente de novo.";
  }
  return "Algo deu errado. Tente de novo em instantes.";
}
