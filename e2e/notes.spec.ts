import { expect, test } from "@playwright/test";

// Usuário semeado por prisma/seed.ts no api-notes.
const EMAIL = "alice@example.com";
const PASSWORD = "senha123";

test.describe("login e CRUD de notas", () => {
  test("login com credenciais erradas mostra mensagem de erro", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', "senha-errada");
    await page.click('button[type="submit"]');

    // page.getByRole("alert") também pega o route-announcer interno do
    // Next.js — miramos no texto direto pra evitar ambiguidade.
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login, criar nota, persistir, apagar, logout e confirmar sessão revogada", async ({
    page,
  }) => {
    const noteTitle = `Nota E2E ${Date.now()}`;

    await page.goto("/login");
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/notes$/);

    // criar
    await page.fill('input[name="title"]', noteTitle);
    await page.fill("#new-note-content", "Conteúdo criado pelo Playwright.");
    await page.click('button:has-text("Salvar nota")');
    await expect(page.getByText(noteTitle)).toBeVisible();

    // persistiu de verdade no servidor, não só no estado do cliente
    await page.reload();
    await expect(page.getByText(noteTitle)).toBeVisible();

    // apagar
    const card = page.locator("li", { hasText: noteTitle });
    await card.hover();
    await card.getByRole("button", { name: /Apagar/ }).click();
    await expect(page.getByText(noteTitle)).not.toBeVisible();

    // logout
    await page.click('button:has-text("Sair")');
    await expect(page).toHaveURL(/\/login$/);

    // sessão foi revogada de verdade no servidor, não só limpa no cliente
    await page.goto("/notes");
    await expect(page).toHaveURL(/\/login$/);
  });
});
