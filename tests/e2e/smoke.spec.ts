import { expect, test } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Kova/i);
});

test("pricing page shows three tiers", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("Free")).toBeVisible();
  await expect(page.getByText("Pro")).toBeVisible();
  await expect(page.getByText("Enterprise")).toBeVisible();
});

test("docs page loads", async ({ page }) => {
  await page.goto("/docs");
  await expect(page.locator("body")).toContainText("Kova");
});

test("dashboard redirects to login when not authenticated", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("body")).toContainText(/sign in|log in|github/i);
});
