// Mutator customizado usado pelo cliente gerado pelo Orval (ver
// orval.config.ts). Centraliza o que é comum a toda chamada HTTP da API:
//
// - cookies de sessão (credentials: 'include') — a API usa sessão por
//   cookie, nunca Bearer Token (ver CLAUDE.md);
// - o contrato representa as rotas internas do NestJS (ex.: "/v1/notes",
//   "/health"); este mutator acrescenta a fronteira pública `/api`,
//   pertencente ao proxy, sem expor IP interno ou trocar de origem;
// - parsing uniforme de erro RFC 7807 (application/problem+json), que é
//   o formato que a API sempre devolve (ver ProblemDetailsFilter no
//   api-notes).
//
// Este arquivo é código nosso, não gerado — vive fora de
// src/generated/api/ por decisão (ver CLAUDE.md).

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | undefined;

  constructor(status: number, problem: ProblemDetails | undefined) {
    super(problem?.detail ?? problem?.title ?? `Erro HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

async function parseProblemDetails(
  response: Response,
): Promise<ProblemDetails | undefined> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await parseProblemDetails(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
