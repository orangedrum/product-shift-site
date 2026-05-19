import { test, expect } from '@playwright/test';

test.describe('Resume Tiered Experience Validation', () => {
  test('should render strategic section with bullets and foundational section without them', async ({ page }) => {
    // 1. Load a known test slug (Replace with a valid one from your DB for local testing)
    await page.goto('/resume/applied-ai-strategist-test');

    // 2. Verify Strategic Section (Tier 1)
    const strategicSection = page.locator('#experience');
    await expect(strategicSection).toBeVisible();
    
    // Ensure Tier 1 contains bullet points (CheckCircle icons)
    const bullets = strategicSection.locator('svg.text-green-500');
    const bulletCount = await bullets.count();
    expect(bulletCount).toBeGreaterThan(0);

    // 3. Verify Foundational Section (Tier 2)
    const foundationalSection = page.locator('text=Earlier Professional Highlights');
    if (await foundationalSection.isVisible()) {
      // Ensure Tier 2 does NOT contain bullet points
      const foundationalBullets = foundationalSection.locator('ul');
      await expect(foundationalBullets).not.toBeVisible();
      
      // Ensure it contains one-line style text (Company names)
      await expect(page.locator('text=@')).toBeVisible();
    }
  });
});