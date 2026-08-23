import type { NoteDto } from "@/src/generated/api/models";
import { formatNoteDate } from "./format-date";

interface NoteCardProps {
  note: NoteDto;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function NoteCard({ note, onDelete, isDeleting }: NoteCardProps) {
  return (
    <li className="group note-enter rounded-lg border border-line bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-lg font-medium text-ink">
          {note.title}
        </h3>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          className="shrink-0 text-sm text-danger opacity-40 transition-opacity hover:underline hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-60"
        >
          {isDeleting ? "Apagando…" : "Apagar"}
        </button>
      </div>
      <div className="mt-1 border-t border-dashed border-line pt-2">
        {note.content ? (
          <p className="whitespace-pre-wrap text-sm text-ink-soft">
            {note.content}
          </p>
        ) : (
          <p className="text-sm italic text-ink-faint">Sem conteúdo.</p>
        )}
      </div>
      <p className="mt-3 font-mono text-xs text-ink-faint">
        atualizada em {formatNoteDate(note.updatedAt)}
      </p>
    </li>
  );
}
