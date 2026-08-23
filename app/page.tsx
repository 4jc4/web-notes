import { redirect } from "next/navigation";

// A sessão é validada no cliente (cookie httpOnly, não visível aqui no
// servidor sem reenviar o cookie manualmente) — /notes decide, ao
// carregar, se redireciona para /login. Ver src/features/notes/NotesView.tsx.
export default function RootPage() {
  redirect("/notes");
}
