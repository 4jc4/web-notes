import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { NoteDto } from "@/src/generated/api/models";
import { NoteCard } from "./NoteCard";

const baseNote: NoteDto = {
  id: "note-1",
  title: "Lista de compras",
  content: "Leite, ovos, café",
  ownerId: "user-1",
  createdAt: "2026-03-15T14:30:00.000Z",
  updatedAt: "2026-03-16T09:00:00.000Z",
  deletedAt: null,
};

describe("NoteCard", () => {
  it("mostra título e conteúdo da nota", () => {
    render(
      <ul>
        <NoteCard note={baseNote} onDelete={vi.fn()} isDeleting={false} />
      </ul>,
    );

    expect(screen.getByText("Lista de compras")).toBeInTheDocument();
    expect(screen.getByText("Leite, ovos, café")).toBeInTheDocument();
  });

  it("mostra 'Sem conteúdo.' quando content é null", () => {
    render(
      <ul>
        <NoteCard
          note={{ ...baseNote, content: null }}
          onDelete={vi.fn()}
          isDeleting={false}
        />
      </ul>,
    );

    expect(screen.getByText("Sem conteúdo.")).toBeInTheDocument();
  });

  it("chama onDelete com o id da nota ao clicar em Apagar", async () => {
    const onDelete = vi.fn();
    render(
      <ul>
        <NoteCard note={baseNote} onDelete={onDelete} isDeleting={false} />
      </ul>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Apagar" }));

    expect(onDelete).toHaveBeenCalledWith("note-1");
  });

  it("desabilita o botão e mostra 'Apagando…' quando isDeleting é true", () => {
    render(
      <ul>
        <NoteCard note={baseNote} onDelete={vi.fn()} isDeleting />
      </ul>,
    );

    const button = screen.getByRole("button", { name: "Apagando…" });
    expect(button).toBeDisabled();
  });
});
