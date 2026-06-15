import { expect, test } from "@playwright/test";

/**
 * Smoke E2E — nécessite une session authentifiée (E2E_AUTH_COOKIE) ou login manuel.
 * Sans cookie : vérifie au minimum les gardes d’accès et la présence des routes.
 */
test.describe("Jaeger — Gestionnaire de missions", () => {
  test("page /jaeger redirige ou affiche le module", async ({ page }) => {
    await page.goto("/jaeger");
    await expect(page).toHaveURL(/\/(jaeger|login|account)/);
    const title = page.getByRole("heading", { name: /Jaeger|Gestionnaire|missions/i });
    await expect(title.first()).toBeVisible({ timeout: 15_000 });
  });

  test("API missions KPI répond 401 sans auth", async ({ request }) => {
    const backend = process.env.E2E_BACKEND_URL ?? "http://localhost:3001";
    const res = await request.get(`${backend}/api/app/missions/kpi`);
    expect(res.status()).toBe(401);
  });
});

test.describe("CRM — assistant mission", () => {
  test("page contacts Myster charge", async ({ page }) => {
    await page.goto("/myster/contacts");
    await expect(page).toHaveURL(/\/(myster\/contacts|login|account)/);
    const heading = page.getByRole("heading", { name: /Base prospects|prospects/i });
    await expect(heading.first()).toBeVisible({ timeout: 15_000 });
  });
});
