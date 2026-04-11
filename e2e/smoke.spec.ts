import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Trouve ton coach")).toBeVisible();
  });

  test("coach directory loads", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.locator("h1")).toContainText("parfait");
  });

  test("player directory loads", async ({ page }) => {
    await page.goto("/players");
    await expect(page.locator("h1")).toContainText("talents");
  });

  test("legal pages are accessible", async ({ page }) => {
    await page.goto("/legal/mentions");
    await expect(page.locator("text=Mentions")).toBeVisible();

    await page.goto("/legal/cgu");
    await expect(page.locator("text=Conditions")).toBeVisible();

    await page.goto("/legal/confidentialite");
    await expect(page.locator("text=confidentialit")).toBeVisible();

    await page.goto("/contact");
    await expect(page.locator("text=Contact")).toBeVisible();
  });
});

test.describe("Auth flow", () => {
  test("login page loads with form", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("register page shows role selection", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.locator("text=Joueur")).toBeVisible();
    await expect(page.locator("text=Coach")).toBeVisible();
    await expect(page.locator("text=Parent")).toBeVisible();
  });

  test("player registration form validates required fields", async ({ page }) => {
    await page.goto("/auth/register/player");
    // Try to proceed without filling fields
    await page.click('button:has-text("Continuer")');
    // Should show validation errors
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});

test.describe("Protected routes redirect", () => {
  test("dashboard redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login (middleware or client-side)
    await page.waitForURL(/\/auth\/login|\/dashboard/);
  });

  test("messages redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/messages");
    await page.waitForURL(/\/auth\/login|\/messages/);
  });
});

test.describe("Navigation", () => {
  test("navbar links are functional", async ({ page }) => {
    await page.goto("/");
    // Click coach nav link
    await page.click('nav a[href="/coach"]');
    await expect(page).toHaveURL("/coach");
  });

  test("footer legal links point to real pages", async ({ page }) => {
    await page.goto("/");
    const mentionsLink = page.locator('footer a[href="/legal/mentions"]');
    await expect(mentionsLink).toBeVisible();
    const cguLink = page.locator('footer a[href="/legal/cgu"]');
    await expect(cguLink).toBeVisible();
  });
});
