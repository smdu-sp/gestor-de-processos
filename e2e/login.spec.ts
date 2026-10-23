import { test, expect } from "@playwright/test";
test("login SMUL: erro, tema, responsividade e encerramento da sessão", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Login", { exact: true }).fill("z999999");
  await page.getByLabel("Senha", { exact: true }).fill("senha-invalida-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Login ou senha inválidos",
  );
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.getByRole("button", { name: "Escuro", exact: true }).click();
  await expect(page.locator('main[data-theme="dark"]')).toBeVisible();
  await page.screenshot({ path: "test-results/login-dark.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "test-results/login-mobile.png" });
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/processos");
  await expect(page).toHaveURL(/login/);
});
