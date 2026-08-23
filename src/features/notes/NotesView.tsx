"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/Button";
import {
  authControllerLogout,
  notesControllerFindAll,
  notesControllerRemove,
} from "@/src/generated/api/client";
import type { NoteDto } from "@/src/generated/api/models";
import { ApiError } from "@/src/lib/api/fetcher";
import { friendlyErrorMessage } from "@/src/lib/api/friendly-error";
import { NewNoteForm } from "./NewNoteForm";
import { NoteCard } from "./NoteCard";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; notes: NoteDto[] };

export function NotesView() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    notesControllerFindAll()
      .then((notes) => {
        if (!cancelled) setState({ status: "ready", notes });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        setState({ status: "error", message: friendlyErrorMessage(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleCreated(note: NoteDto) {
    setState((prev) =>
      prev.status === "ready"
        ? { status: "ready", notes: [note, ...prev.notes] }
        : prev,
    );
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await notesControllerRemove(id);
      setState((prev) =>
        prev.status === "ready"
          ? { status: "ready", notes: prev.notes.filter((n) => n.id !== id) }
          : prev,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      // Erro de exclusão não some a lista — só reporta e deixa a nota
      // onde estava, pra tentar de novo.
      window.alert(friendlyErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authControllerLogout();
    } catch {
      // mesmo se a chamada falhar, seguimos para o login — não faz
      // sentido prender o usuário numa sessão que ele quer encerrar.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-ink">Notas</h1>
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Saindo…" : "Sair"}
        </Button>
      </header>

      <NewNoteForm onCreated={handleCreated} />

      {state.status === "loading" ? (
        <p className="text-sm text-ink-soft">Carregando notas…</p>
      ) : null}

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" && state.notes.length === 0 ? (
        <p className="text-sm italic text-ink-faint">
          Nenhuma nota ainda. Escreva a primeira acima.
        </p>
      ) : null}

      {state.status === "ready" && state.notes.length > 0 ? (
        <ul className="notebook-rail flex flex-col gap-3 py-1 pl-6">
          {state.notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              isDeleting={deletingId === note.id}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
