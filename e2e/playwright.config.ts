import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./missions",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_SKIP_WEB_SERVER
    ? undefined
    : [
        {
          command: "cd ../backend && bun run dev",
          url: "http://localhost:3001/health",
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: "cd ../web && bun run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
