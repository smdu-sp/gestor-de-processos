import { test, expect } from "@playwright/test";
test("login, carteira, histórico, relatórios e viewport móvel", async ({
  page,
}) => {
  test.skip(
    process.env.DEMO_MODE !== "true",
    "Este cenário requer a base demonstrativa com 12 processos.",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("Browser:", e.message);
  });
  await page.goto("/processos");
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Login", { exact: true }).fill("d000001");
  await page
    .getByLabel("Senha", { exact: true })
    .fill(process.env.SEED_PASSWORD!);
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith("/api/auth") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await page.goto("/processos?priority=true");
  await expect(
    page.getByRole("heading", { name: "Processos", exact: true }),
  ).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await page.locator(".process-number").first().click();
  await expect(
    page.getByRole("heading", { name: "Histórico do processo" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "← Voltar à carteira" }).click();
  await expect(page).toHaveURL(/priority=true/);
  await page.goto("/relatorios");
  await expect(
    page.getByRole("heading", { name: "Por técnico e unidade" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Invalid Date");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
