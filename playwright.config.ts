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
    // Base URL for staging (Update this if your staging URL differs)
    baseURL: process.env.BASE_URL || 'https://product-shift-site-git-staging-jeans-projects-3cddd625.vercel.app',
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
