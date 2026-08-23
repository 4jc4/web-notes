import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-[var(--paper)] hover:bg-accent-strong disabled:bg-ink-faint",
  ghost:
    "bg-transparent text-ink-soft hover:text-ink hover:bg-black/[.04] dark:hover:bg-white/[.06]",
  danger: "bg-transparent text-danger hover:bg-danger-soft",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
