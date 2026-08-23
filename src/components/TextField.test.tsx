import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "./TextField";

describe("TextField", () => {
  it("associa o label ao input", () => {
    render(<TextField label="E-mail" />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("sem erro, não marca aria-invalid nem mostra mensagem", () => {
    render(<TextField label="E-mail" />);
    const input = screen.getByLabelText("E-mail");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("com erro, marca aria-invalid e mostra a mensagem associada", () => {
    render(<TextField label="E-mail" error="E-mail inválido" />);

    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const message = screen.getByText("E-mail inválido");
    expect(input).toHaveAttribute("aria-describedby", message.id);
  });
});
