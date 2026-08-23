import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NoteDto } from "@/src/generated/api/models";
import { NewNoteForm } from "./NewNoteForm";

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));

vi.mock("@/src/generated/api/client", () => ({
  notesControllerCreate: mockCreate,
}));

const createdNote: NoteDto = {
  id: "note-1",
  title: "Nova nota",
  content: "Conteúdo",
  ownerId: "user-1",
  createdAt: "2026-03-15T14:30:00.000Z",
  updatedAt: "2026-03-15T14:30:00.000Z",
  deletedAt: null,
};

describe("NewNoteForm", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("não envia e mostra erro quando o título está vazio", async () => {
    render(<NewNoteForm onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Salvar nota" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dê um título para a nota.",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("cria a nota, chama onCreated e limpa o formulário", async () => {
    mockCreate.mockResolvedValueOnce(createdNote);
    const onCreated = vi.fn();
    render(<NewNoteForm onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText("Título"), "Nova nota");
    await userEvent.type(
      screen.getByLabelText(/Conteúdo/),
      "Conteúdo",
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar nota" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: "Nova nota",
        content: "Conteúdo",
      });
    });
    expect(onCreated).toHaveBeenCalledWith(createdNote);
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("envia content como undefined quando o campo fica em branco", async () => {
    mockCreate.mockResolvedValueOnce(createdNote);
    render(<NewNoteForm onCreated={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Título"), "Só título");
    await userEvent.click(screen.getByRole("button", { name: "Salvar nota" }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: "Só título",
        content: undefined,
      });
    });
  });

  it("mostra mensagem de erro amigável quando a API falha", async () => {
    mockCreate.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    render(<NewNoteForm onCreated={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Título"), "Nota qualquer");
    await userEvent.click(screen.getByRole("button", { name: "Salvar nota" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar. Verifique sua conexão e tente de novo.",
    );
  });
});
