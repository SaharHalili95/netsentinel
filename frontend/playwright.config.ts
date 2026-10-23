import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the static demo build, on phone and desktop browsers.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4190", trace: "retain-on-failure" },
  projects: [
    { name: "iphone-14", use: { ...devices["iPhone 14"] } },
    { name: "pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "NEXT_PUBLIC_DEMO=1 npx next build && node e2e/serve.mjs 4190",
    url: "http://localhost:4190",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
