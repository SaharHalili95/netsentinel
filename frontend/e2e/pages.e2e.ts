import { expect, test } from "@playwright/test";
import { ROUTES, expectNoHorizontalOverflow, openPage, useHebrew } from "./helpers";

for (const lang of ["en", "he"] as const) {
  test.describe(`pages (${lang})`, () => {
    test.beforeEach(async ({ page }) => {
      if (lang === "he") await useHebrew(page);
    });

    for (const route of ROUTES) {
      test(`${route} renders without horizontal overflow`, async ({ page }) => {
        await openPage(page, route);
        await expectNoHorizontalOverflow(page);
      });
    }
  });
}

test("trusting a device updates the table", async ({ page }) => {
  await openPage(page, "/devices/");
  const toggle = page.getByRole("button", { name: "Mark living-room-tv as trusted" });

  await toggle.click();

  await expect(page.getByRole("button", { name: "Mark living-room-tv as not trusted" })).toHaveAttribute("aria-pressed", "true");
});

test("acknowledging and resolving an alert updates its status", async ({ page }) => {
  await openPage(page, "/alerts/");
  const title = "New unknown device: 192.168.1.150";

  await page.getByRole("button", { name: `Acknowledge: ${title}` }).click();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toContainText("Acknowledged");

  await page.getByRole("button", { name: `Resolve: ${title}` }).click();
  await expect(page.getByRole("listitem").filter({ hasText: title })).toContainText("Resolved");
});

test("running a scan adds it to the history", async ({ page }) => {
  await openPage(page, "/scans/");
  const history = page.getByRole("region", { name: "Scan history" }).getByRole("listitem");
  const before = await history.count();

  await page.getByRole("button", { name: "Run Port scan" }).click();

  await expect(history).toHaveCount(before + 1);
});

test("a device row expands to show its open ports", async ({ page }) => {
  await openPage(page, "/devices/");

  await page.getByRole("button", { name: /^desktop-pc/ }).click();

  await expect(page.getByText("3389/tcp")).toBeVisible();
});

test("on desktop the navigation is always visible", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones use the menu button");
  await openPage(page, "/");

  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Devices" })).toBeInViewport();
});
