import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NoteDto } from "@/src/generated/api/models";
import { ApiError } from "@/src/lib/api/fetcher";
import { NotesView } from "./NotesView";

const { mockReplace, mockRefresh, mockFindAll, mockRemove, mockLogout, mockCreate } =
  vi.hoisted(() => ({
    mockReplace: vi.fn(),
    mockRefresh: vi.fn(),
    mockFindAll: vi.fn(),
    mockRemove: vi.fn(),
    mockLogout: vi.fn(),
    mockCreate: vi.fn(),
  }));

// Objeto estável entre renders — igual ao useRouter() real do Next.js.
// Um literal novo a cada chamada mudaria de identidade a cada render e
// re-disparia o efeito que depende de [router] (loop de useEffect só
// neste mock, não é bug do componente). Construído dentro da factory
// (não como const solta) porque vi.mock é hoisted acima de consts
// comuns.
vi.mock("next/navigation", () => {
  const router = { replace: mockReplace, refresh: mockRefresh };
  return { useRouter: () => router };
});

vi.mock("@/src/generated/api/client", () => ({
  notesControllerFindAll: mockFindAll,
  notesControllerRemove: mockRemove,
  authControllerLogout: mockLogout,
  notesControllerCreate: mockCreate,
}));

const note = (overrides: Partial<NoteDto> = {}): NoteDto => ({
  id: "note-1",
  title: "Nota existente",
  content: "Algum conteúdo",
  ownerId: "user-1",
  createdAt: "2026-03-15T14:30:00.000Z",
  updatedAt: "2026-03-15T14:30:00.000Z",
  deletedAt: null,
  ...overrides,
});

describe("NotesView", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockFindAll.mockReset();
    mockRemove.mockReset();
    mockLogout.mockReset();
    mockCreate.mockReset();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("mostra 'Carregando notas…' e depois a lista", async () => {
    mockFindAll.mockResolvedValueOnce([note()]);
    render(<NotesView />);

    expect(screen.getByText("Carregando notas…")).toBeInTheDocument();

    expect(await screen.findByText("Nota existente")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há notas", async () => {
    mockFindAll.mockResolvedValueOnce([]);
    render(<NotesView />);

    expect(
      await screen.findByText("Nenhuma nota ainda. Escreva a primeira acima."),
    ).toBeInTheDocument();
  });

  it("redireciona pra /login quando o carregamento inicial dá 401", async () => {
    mockFindAll.mockRejectedValueOnce(new ApiError(401, undefined));
    render(<NotesView />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra erro genérico quando o carregamento inicial falha por outro motivo", async () => {
    mockFindAll.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<NotesView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar. Verifique sua conexão e tente de novo.",
    );
  });

  it("apaga uma nota e a remove da lista", async () => {
    mockFindAll.mockResolvedValueOnce([note()]);
    mockRemove.mockResolvedValueOnce(undefined);
    render(<NotesView />);

    await screen.findByText("Nota existente");
    await userEvent.click(screen.getByRole("button", { name: "Apagar" }));

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith("note-1");
    });
    await waitFor(() => {
      expect(screen.queryByText("Nota existente")).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("Nenhuma nota ainda. Escreva a primeira acima."),
    ).toBeInTheDocument();
  });

  it("redireciona pra /login quando apagar dá 401", async () => {
    mockFindAll.mockResolvedValueOnce([note()]);
    mockRemove.mockRejectedValueOnce(new ApiError(401, undefined));
    render(<NotesView />);

    await screen.findByText("Nota existente");
    await userEvent.click(screen.getByRole("button", { name: "Apagar" }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("mostra alert e mantém a nota quando apagar falha por outro motivo", async () => {
    mockFindAll.mockResolvedValueOnce([note()]);
    mockRemove.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<NotesView />);

    await screen.findByText("Nota existente");
    await userEvent.click(screen.getByRole("button", { name: "Apagar" }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Não foi possível conectar. Verifique sua conexão e tente de novo.",
      );
    });
    expect(screen.getByText("Nota existente")).toBeInTheDocument();
  });

  it("adiciona a nota criada pelo NewNoteForm no topo da lista", async () => {
    mockFindAll.mockResolvedValueOnce([note()]);
    mockCreate.mockResolvedValueOnce(
      note({ id: "note-2", title: "Nota nova" }),
    );
    render(<NotesView />);

    await screen.findByText("Nota existente");

    await userEvent.type(screen.getByLabelText("Título"), "Nota nova");
    await userEvent.click(screen.getByRole("button", { name: "Salvar nota" }));

    expect(await screen.findByText("Nota nova")).toBeInTheDocument();
    expect(screen.getByText("Nota existente")).toBeInTheDocument();
  });

  it("desloga: chama logout, redireciona e atualiza mesmo se a API falhar", async () => {
    mockFindAll.mockResolvedValueOnce([]);
    mockLogout.mockRejectedValueOnce(new Error("indisponível"));
    render(<NotesView />);

    await screen.findByText("Nenhuma nota ainda. Escreva a primeira acima.");
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledOnce();
    });
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(mockRefresh).toHaveBeenCalledOnce();
  });
});
