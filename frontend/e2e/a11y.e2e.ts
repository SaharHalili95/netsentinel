import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ROUTES, openPage, useHebrew } from "./helpers";

for (const lang of ["en", "he"] as const) {
  test.describe(`accessibility (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      if (lang === "he") await useHebrew(page);
    });

    for (const route of ROUTES) {
      test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
        await openPage(page, route);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`);
        expect(summary).toEqual([]);
      });
    }
  });
}

test("the skip link moves focus to the main content", async ({ page }) => {
  await openPage(page, "/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.locator("main#main")).toBeFocused();
});

test("the mobile menu opens and closes with the keyboard", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button only exists on small screens");
  await openPage(page, "/");
  const toggle = page.getByRole("button", { name: "Open menu" });

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
  await expect(toggle).toBeFocused();
});
