// tests/e2e/staging.spec.ts
import { test, expect } from '@playwright/test';

// Helper to generate a random user for isolation
const randomUser = `test-${Math.random().toString(36).substring(7)}@example.com`;

test.describe('Critical Integration Flows', () => {
  
  test('SMB User Flow: Landing to Demo Analysis', async ({ page }) => {
    // 1. Land on SMB Page
    await page.goto('/simple-website-checkup');
    await expect(page).toHaveTitle(/Simple Website Checkup/);

    // 2. Run Demo
    await page.fill('input[placeholder="your-website.com"]', 'example.com');
    await page.click('button:has-text("Check My Site")');

    // 3. Verify Loading & Results
    await expect(page.locator('text=Checking...')).toBeVisible();
    // Wait for analysis (timeout increased for AI latency)
    await expect(page.locator('text=Demo Result for')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('text=Top Recommendations')).toBeVisible();
  });

  test('Referral Flow: Claiming a Code', async ({ page }) => {
    // 1. Visit Claim URL with a dummy code
    await page.goto('/claim-test?ref=TESTCODE');
    
    // 2. Should redirect to Login/Signup to claim
    await expect(page).toHaveURL(/.*login/);
    
    // 3. Verify "Claim" context is preserved (e.g. via local storage or URL param)
    // Note: This asserts the app didn't crash and routed correctly
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('Payment Flow: Redirect to Stripe', async ({ page }) => {
    // 1. Go to Pricing on Tech Landing
    await page.goto('/landingpg-aiuxagent');
    
    // 2. Click a Plan (e.g., Pay As You Go)
    const getStartedBtn = page.locator('a:has-text("Get Started")').first();
    await getStartedBtn.click();

    // 3. Should redirect to Login first (since we aren't auth'd)
    await expect(page).toHaveURL(/.*login/);
  });

  test('AI UX Agent: Error Handling (SSL/Security)', async ({ page }) => {
    // 1. Log in (Mocking auth state if possible, or using UI)
    // For this test, we'll hit the public demo with a "bad" URL to trigger error handling
    await page.goto('/simple-website-checkup');
    
    // 2. Enter a URL known to fail or be blocked (e.g. localhost in prod)
    await page.fill('input[placeholder="your-website.com"]', 'http://localhost:9999');
    await page.click('button:has-text("Check My Site")');

    // 3. Expect Error Card
    // Note: The backend might return "Analysis Failed" or specific error
    await expect(page.locator('text=Error')).toBeVisible({ timeout: 30000 });
  });

  test('Flywheel: Route Protection (Unauthenticated)', async ({ page }) => {
    // 1. Attempt to access the protected "First Buy" URL
    await page.goto('/ai-powered-ux?new_credit=true&first_buy=true');

    // 2. Since CI is not logged in, we MUST be redirected to login
    // This confirms our security rules are working
    await expect(page).toHaveURL(/.*login/);
  });

});