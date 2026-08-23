"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/src/components/Button";
import { TextField } from "@/src/components/TextField";
import type { NoteDto } from "@/src/generated/api/models";
import { notesControllerCreate } from "@/src/generated/api/client";
import { friendlyErrorMessage } from "@/src/lib/api/friendly-error";

interface NewNoteFormProps {
  onCreated: (note: NoteDto) => void;
}

export function NewNoteForm({ onCreated }: NewNoteFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Dê um título para a nota.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const note = await notesControllerCreate({
        title: title.trim(),
        content: content.trim() || undefined,
      });
      onCreated(note);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-line bg-card p-5"
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Título"
          name="title"
          placeholder="Sobre o que é a nota?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="new-note-content"
            className="text-sm font-medium text-ink-soft"
          >
            Conteúdo <span className="text-ink-faint">(opcional)</span>
          </label>
          <textarea
            id="new-note-content"
            name="content"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-y rounded-md border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus-visible:border-accent"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : "Salvar nota"}
          </Button>
        </div>
      </div>
    </form>
  );
}
