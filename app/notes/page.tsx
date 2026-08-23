import type { Metadata } from "next";
import { NotesView } from "@/src/features/notes/NotesView";

export const metadata: Metadata = {
  title: "Notas",
};

export default function NotesPage() {
  return <NotesView />;
}
