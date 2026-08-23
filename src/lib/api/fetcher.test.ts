import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./fetcher";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devolve o corpo já parseado em JSON quando a resposta é ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "1", email: "alice@example.com" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apiFetch<{ id: string; email: string }>(
      "/api/v1/auth/login",
    );

    expect(result).toEqual({ id: "1", email: "alice@example.com" });
  });

  it("sempre envia credentials: 'include' (sessão por cookie)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await apiFetch("/api/v1/notes");

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options).toMatchObject({ credentials: "include" });
  });

  it("não tenta fazer parse de corpo em respostas 204", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiFetch("/api/v1/notes/123");

    expect(result).toBeUndefined();
  });

  it("lança ApiError com o problem details da API quando a resposta falha", async () => {
    const problem = {
      type: "https://api-notes.dev/errors/401",
      title: "Unauthorized",
      status: 401,
      detail: "Missing session cookie",
      instance: "/api/v1/notes",
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(problem), { status: 401 }),
    );

    await expect(apiFetch("/api/v1/notes")).rejects.toMatchObject({
      status: 401,
      problem,
      message: "Missing session cookie",
    });
  });

  it("ApiError ainda carrega o status quando o corpo do erro não é JSON válido", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("not json", { status: 500 }),
    );

    const error = await apiFetch("/api/v1/notes").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).problem).toBeUndefined();
  });
});
