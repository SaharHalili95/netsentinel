import { expect, type Page } from "@playwright/test";

export const ROUTES = ["/", "/devices/", "/scans/", "/alerts/", "/traffic/", "/compliance/", "/how-it-works/", "/settings/"];

export async function useHebrew(page: Page) {
  await page.addInitScript(() => localStorage.setItem("ns-locale", "he"));
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

export async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Wait for the demo data to render before checking layout.
  await page.waitForLoadState("networkidle");
}
