import { test, expect } from "@playwright/test";
test("acesso à aplicação com MySQL operacional", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Registro funcional").fill("d000001");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Entrar no sistema" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await page.goto("/processos");
  await expect(
    page.getByRole("heading", { name: "Processos", exact: true }),
  ).toBeVisible();
  await page.goto("/relatorios");
  await expect(
    page.getByRole("heading", { name: "Por técnico e unidade" }),
  ).toBeVisible();
});
