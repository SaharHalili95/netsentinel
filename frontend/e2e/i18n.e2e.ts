import { expect, test } from "@playwright/test";
import { openPage } from "./helpers";

test("the language button switches to Hebrew and the choice survives a reload", async ({ page }) => {
  await openPage(page, "/alerts/");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.getByRole("button", { name: "Switch to Hebrew" }).click();

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("התראות");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("התראות");
});

test("IP addresses stay left-to-right in Hebrew", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("ns-locale", "he"));
  await openPage(page, "/devices/");

  await expect(page.locator("bdi", { hasText: "192.168.1.100" })).toHaveAttribute("dir", "ltr");
});
