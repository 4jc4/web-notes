import type { Metadata } from "next";
import { LoginForm } from "@/src/features/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar — Notas",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl italic text-ink">Notas</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Entre para ver suas notas.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
