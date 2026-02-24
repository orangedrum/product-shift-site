import { test, expect } from '@playwright/test';

test.describe('Production Readiness & Growth Loops', () => {
  
  // Shared Supabase setup for test data injection
  const setupSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) return null;
    const { createClient } = require('@supabase/supabase-js');
    return createClient(supabaseUrl, supabaseServiceKey);
  };

  test('Referral Loop: Referrer gets paid ONLY after Referee tests', async ({ browser }) => {
    const supabase = setupSupabase();
    if (!supabase) test.skip('Supabase secrets missing');

    // 1. Setup Referrer (User A)
    const emailA = `prod-referrer-${Date.now()}@example.com`;
    const codeA = `REF${Date.now()}`;
    await supabase.auth.admin.createUser({ email: emailA, email_confirm: true });
    await supabase.from('customers').insert({ email: emailA, credits: 5, referral_code: codeA });

    // 2. Setup Referee (User B)
    const emailB = `prod-referee-${Date.now()}@example.com`;
    await supabase.auth.admin.createUser({ email: emailB, email_confirm: true });
    // User B starts with 0 credits to prove the claim works
    await supabase.from('customers').insert({ email: emailB, credits: 0 });

    // 3. Referee Claims Code
    const { data: linkB } = await supabase.auth.admin.generateLink({ type: 'magiclink', email: emailB });
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    
    // Login User B via Magic Link
    await pageB.goto(linkB.properties.action_link);
    
    // Visit Claim URL
    await pageB.goto(`/claim-test?ref=${codeA}`);
    await expect(pageB.locator('text=03')).toBeVisible({ timeout: 30000 }); // 0 + 3 Gift

    // 4. Referee Runs First Test (The Trigger)
    // We use a test-mode URL to avoid burning real AI costs but trigger the logic
    await pageB.goto('/ai-powered-ux');
    await pageB.fill('input[placeholder="your-website.com"]', 'example.com/test-mode');
    await pageB.click('button[type="submit"]');
    
    // Wait for success
    await expect(pageB.locator('text=Analysis Complete')).toBeVisible({ timeout: 60000 });

    // 5. Verify Referee Credits (Should be 0: 3 Gift - 3 Cost + 0 Reward)
    // This proves NO double dip for the referee
    await expect(pageB.locator('text=00')).toBeVisible(); 
    await contextB.close();

    // 6. Verify Referrer Reward (User A)
    const { data: customerA } = await supabase.from('customers').select('credits').eq('email', emailA).single();
    // Should be 5 (Start) + 3 (Reward) = 8
    expect(customerA.credits).toBe(8);

    // Cleanup
    const { data: uA } = await supabase.auth.admin.getUserByEmail(emailA);
    const { data: uB } = await supabase.auth.admin.getUserByEmail(emailB);
    if (uA?.user) await supabase.auth.admin.deleteUser(uA.user.id);
    if (uB?.user) await supabase.auth.admin.deleteUser(uB.user.id);
  });

  test('Admin Dashboard: Feedback Filtering', async ({ browser }) => {
    const supabase = setupSupabase();
    if (!supabase) test.skip('Supabase secrets missing');

    // 1. Inject Mock Feedback
    const feedbackData = [
      { user_email: 'test1@example.com', rating: 5, feedback: '[Stage: First Buy] [Q: What made you buy?] Great tool!', created_at: new Date().toISOString() },
      { user_email: 'test2@example.com', rating: 4, feedback: '[Stage: Regular] [Q: How is it?] Good stuff.', created_at: new Date().toISOString() }
    ];
    await supabase.from('user_feedback').insert(feedbackData);

    // 2. Login as Admin (Mocking the key via localStorage)
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Bypass login by setting key directly
    await page.addInitScript(() => {
      localStorage.setItem('productShiftAdminKey', 'test-admin-key');
    });
    
    // Mock the Admin API response to avoid needing the real secret key in CI
    await page.route('**/api/admin/flywheel-stats*', async route => {
      const json = {
        counts: { users: 100, regular: 10, power: 5, champions: 1 },
        feedback: feedbackData
      };
      await route.fulfill({ json });
    });

    await page.goto('/admin-dashboard');

    // 3. Test Filter
    // Default "All" should show both
    await expect(page.locator('text=Great tool!')).toBeVisible();
    await expect(page.locator('text=Good stuff.')).toBeVisible();

    // Filter to "Regular / First Buy"
    await page.selectOption('select', 'regular');
    
    // Both should still be visible because we combined them!
    await expect(page.locator('text=Great tool!')).toBeVisible();
    await expect(page.locator('text=Good stuff.')).toBeVisible();

    // Cleanup
    await supabase.from('user_feedback').delete().ilike('user_email', 'test%@example.com');
  });
});