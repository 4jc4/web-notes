import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/src/lib/api/fetcher";
import { LoginForm } from "./LoginForm";

const { mockReplace, mockRefresh, mockLogin } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
  mockLogin: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}));

vi.mock("@/src/generated/api/client", () => ({
  authControllerLogin: mockLogin,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockLogin.mockReset();
  });

  it("faz login com sucesso e redireciona para /notes", async () => {
    mockLogin.mockResolvedValueOnce({ id: "1", email: "alice@example.com" });
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "alice@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "senha123",
      });
    });
    expect(mockReplace).toHaveBeenCalledWith("/notes");
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("mostra mensagem específica quando a API devolve 401", async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, undefined));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "alice@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senhaerrada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha incorretos.",
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("mostra mensagem genérica pra outros erros (ex.: rede)", async () => {
    mockLogin.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "alice@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar. Verifique sua conexão e tente de novo.",
    );
  });
});
