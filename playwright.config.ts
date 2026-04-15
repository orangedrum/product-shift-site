// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Give tests more time to run, especially with AI latency.
  timeout: 90 * 1000, // 90 seconds
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    // Base URL for tests (Defaults to production, but overridden by CI env vars for staging)
    baseURL: process.env.BASE_URL || 'https://www.theproductshift.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
