import express from 'express';
import { supabase, sendEmail, isTestEmail, emailFrom } from './services';
import { generateStructuredData } from './analysis-controller';
import { generateEnhancedContent } from './ai-service';
import { marketingEmails } from './email-templates';

const router = express.Router();

// Middleware to check Admin Secret Key for most routes
const requireAdminKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// --- Admin Stats Endpoint ---
router.get('/stats', requireAdminKey, async (req, res) => {
  const excludeTest = req.query.exclude_test_data === 'true';
  
  // FORCE FRESH DATA: Disable caching to prevent 304s and ensure filters run
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    // 1. Counts (With Filter Support)
    let testsQuery = supabase.from('analysis_runs').select('*', { count: 'exact', head: true });
    let usersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });

    if (excludeTest) {
      // Apply strict filters to counts
      usersQuery = usersQuery.not('email', 'ilike', '%test%').not('email', 'ilike', '%demo%').not('email', 'ilike', '%example%').not('email', 'ilike', '%localhost%').not('email', 'ilike', '%+smb%');
      testsQuery = testsQuery.not('user_identifier', 'ilike', '%test%').not('user_identifier', 'ilike', '%demo%').not('user_identifier', 'ilike', '%example%').not('user_identifier', 'ilike', '%localhost%').not('user_identifier', 'ilike', '%+smb%');
    }

    const { count: totalTests } = await testsQuery;
    const { count: totalUsers } = await usersQuery;
    
    // UNIFIED FILTERING STRATEGY: Fetch all payments, then filter in memory using the single source of truth.
    // Match Golden Record: Only fetch 'paid' status
    const { data: allPaymentsData } = await supabase.from('payments').select('amount_total, created_at, email, status').eq('status', 'paid');
    const allPayments = allPaymentsData || [];
    
    // Filter using the central helper (which now includes jeankaluza+)
    const payments = excludeTest 
      ? allPayments.filter(p => !isTestEmail(p.email)) 
      : allPayments;

    // DEBUG: Log the contributors to revenue to identify the "Ghost" data
    if (excludeTest) {
        console.log('💰 Revenue Contributors:', payments.map(p => `${p.email} ($${p.amount_total/100})`));
    }

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount_total || 0), 0);
    
    // Daily Revenue
    const today = new Date().toISOString().split('T')[0];
    const dailyRevenue = payments
      .filter(p => p.created_at.startsWith(today))
      .reduce((sum, p) => sum + (p.amount_total || 0), 0);

    // Sales Breakdown
    const salesBreakdown = { pack3: 0, pack15: 0, starter: 0 };
    payments.forEach((p: any) => {
      if (p.amount_total === 1400) salesBreakdown.pack3++; // 9 Credits
      else if (p.amount_total === 6900) salesBreakdown.pack15++; // 45 Credits
      else if (p.amount_total === 2900) salesBreakdown.starter++;
    });

    // Revenue Chart (Last 30 Days)
    const revenueChart: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    payments.forEach((p: any) => {
      const date = p.created_at.split('T')[0];
      if (new Date(date) >= thirtyDaysAgo) {
        revenueChart[date] = (revenueChart[date] || 0) + (p.amount_total / 100);
      }
    });

    // Fill in missing days with 0 for the chart
    const chartData = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartData.unshift({ date: dateStr.slice(5), amount: revenueChart[dateStr] || 0 }); // slice(5) for MM-DD format
    }

    // 2. Lists (Recent Activity)
    const { data: recentPaymentsData } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: recentErrors } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: recentRuns } = await supabase.from('analysis_runs').select('id, url, plan_type, created_at, user_identifier').order('created_at', { ascending: false }).limit(20);
    const { data: recentSubscribers } = await supabase.from('customers').select('id, email, plan_status, created_at').eq('plan_status', 'active').order('created_at', { ascending: false }).limit(10);

    // 3. Filter Test Data (if requested)
    const filter = (list: any[]) => excludeTest ? list.filter(item => !isTestEmail(item.email || item.user_identifier || '')) : list;

    res.json({
      _generatedAt: new Date().toISOString(), // Force response difference to break ETag caching
      totalTests: totalTests || 0,
      totalUsers: totalUsers || 0,
      totalRevenue: totalRevenue / 100,
      dailyRevenue: dailyRevenue / 100,
      salesBreakdown,
      chartData,
      recentPayments: filter(recentPaymentsData || []),
      recentErrors: recentErrors || [],
      recentRuns: recentRuns || [],
      recentSubscribers: filter(recentSubscribers || [])
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin: Coupons ---
router.get('/coupons', requireAdminKey, async (req, res) => {
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

router.post('/create-coupon', requireAdminKey, async (req, res) => {
  const { code, credits } = req.body;
  const { error } = await supabase.from('coupons').insert({ code: code.toUpperCase(), credits });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.delete('/coupons/:id', requireAdminKey, async (req, res) => {
  const { error } = await supabase.from('coupons').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Admin: Test Users ---
router.get('/test-users', requireAdminKey, async (req, res) => {
  const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  const testUsers = (data || []).filter(u => isTestEmail(u.email));
  res.json(testUsers);
});

router.post('/delete-users', requireAdminKey, async (req, res) => {
  const { users } = req.body;
  if (!users || !Array.isArray(users)) return res.status(400).json({ error: 'Invalid users list' });
  
  const ids = users.map(u => u.id);
  const emails = users.map(u => u.email);

  await supabase.from('customers').delete().in('id', ids);
  await supabase.from('daily_usage').delete().in('user_identifier', emails);
  
  res.json({ success: true, deletedCount: ids.length });
});

// --- Admin: Invite User ---
router.post('/invite-user', requireAdminKey, async (req, res) => {
  const { email, credits, segment } = req.body;
  
  // 1. Create/Update Customer Record
  const { error: dbError } = await supabase.from('customers').upsert({ 
    email, 
    credits: credits || 3, 
    segment: segment || 'tech',
    plan_status: 'free'
  }, { onConflict: 'email' });

  if (dbError) return res.status(500).json({ error: dbError.message });

  // 2. Ensure Auth User Exists (Idempotent)
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true
  });
  // Ignore "already registered" errors, fail on others
  if (createError && !createError.message.includes('registered') && !createError.message.includes('exists')) {
     console.error('Invite User Auth Error:', createError);
  }

  // 3. Generate Direct Magic Link
  const baseUrl = 'https://www.theproductshift.com';
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${baseUrl}/ai-powered-ux?new_credit=true&segment=${segment || 'tech'}` }
  });

  if (linkError) return res.status(500).json({ error: linkError.message });

  const html = `
    <p>You've been invited to try User Mirror!</p>
    <p>We've loaded your account with <strong>${credits} credits</strong>.</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${linkData.properties.action_link}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">Accept Invite & Log In</a>
    </div>
    <p style="margin-top: 20px; font-size: 12px; color: #666;">This link expires in 24 hours.</p>
  `;
  await sendEmail(email, "You're invited to User Mirror", html, baseUrl);

  res.json({ success: true, message: 'Invite sent' });
});

// --- Admin: Compensate User ---
router.post('/compensate-user', requireAdminKey, async (req, res) => {
  const { email, credits } = req.body;
  await supabase.rpc('add_credits', { user_email: email, amount: credits || 2 });
  
  const baseUrl = 'https://www.theproductshift.com';
  const html = `<p>We've added <strong>${credits} credits</strong> to your account as an apology for the recent issue.</p>`;
  await sendEmail(email, "Credits Added: We're sorry!", html, baseUrl);

  res.json({ success: true });
});

// --- Admin: Refund ---
router.post('/refund', requireAdminKey, async (req, res) => {
  const { paymentId } = req.body;
  const { error } = await supabase.from('payments').update({ status: 'refunded' }).eq('id', paymentId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Admin: Delete Error Log ---
router.delete('/errors/:id', requireAdminKey, async (req, res) => {
  const { error } = await supabase.from('error_logs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Admin: Test Email (Debug) ---
router.post('/test-email', async (req, res) => {
  const { email, template } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  if (!process.env.RESEND_API_KEY) return res.json({ success: false, error: 'Configuration Error', details: 'RESEND_API_KEY is missing.' });

  const baseUrl = req.get('origin') || 'https://www.theproductshift.com';
  let subject = 'Test Email from Backend';
  let content = '<p>If you see this, Resend is working!</p>';

  if (template && (marketingEmails as any)[template]) {
    const tmpl = (marketingEmails as any)[template];
    subject = `[TEST] ${tmpl.subject}`;
    content = tmpl.body(baseUrl);
  }

  const result = await sendEmail(email, subject, content, baseUrl);
  if (result.success) return res.json({ success: true });
  return res.json({ success: false, error: 'Failed to send email', details: result.error, from: result.from });
});

// --- Admin: Draft Blog Post ---
router.post('/draft-blog-post', async (req, res) => {
  const { reportId, email } = req.body;
  const isAdmin = email && (email.endsWith('@theproductshift.com') || email.includes('+smb') || email.includes('test'));
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  try {
    if (reportId === 'test-mode-dummy-id') {
        await new Promise(r => setTimeout(r, 1000));
        return res.json({ success: true, cmsLink: '/admin-blog' });
    }

    const { data: run } = await supabase.from('analysis_runs').select('report_data, url').eq('id', reportId).single();
    if (!run || !run.report_data) return res.status(404).json({ error: 'Report data not found.' });

    const { title, expertReport, scores, userSessions, screenshot } = run.report_data;
    const safeTitle = title || 'Untitled Audit';
    const seoTitle = `AI UX Audit of ${safeTitle} (${new Date().getFullYear()})`;
    const slug = `ux-audit-${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const seoSchema = generateStructuredData(run.url, seoTitle, scores, expertReport);

    const { blogContent, excerpt } = await generateEnhancedContent(expertReport, userSessions, seoTitle);

    let coverImageUrl: string | null = null;
    if (screenshot) {
      try {
        const imageBuffer = Buffer.from(screenshot, 'base64');
        const imagePath = `public/${slug}.jpg`;
        const { error: uploadError } = await supabase.storage.from('blog-images').upload(imagePath, imageBuffer, { contentType: 'image/jpeg', upsert: true });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('blog-images').getPublicUrl(imagePath);
          coverImageUrl = publicUrlData.publicUrl;
        }
      } catch (uploadError) {
        console.error('Screenshot upload failed:', uploadError);
      }
    }

    const finalContent = `${blogContent}\n\n--- \n\n## SEO Data (JSON-LD)\n\nCopy this block into your page's \`<head>\` section:\n\n\`\`\`json\n${JSON.stringify(seoSchema, null, 2)}\n\`\`\``;
    let contentToSave = finalContent;
    if (coverImageUrl) {
      contentToSave = `!Cover Image\n\n${finalContent}`;
    }

    const { error: insertError } = await supabase.from('posts').insert({
      title: seoTitle,
      slug: slug,
      content: contentToSave,
      excerpt: excerpt,
      status: 'draft',
      category: 'Website Optimization',
      published_at: new Date().toISOString()
    });

    if (insertError) throw insertError;
    return res.json({ success: true, cmsLink: '/admin-blog' });
  } catch (e: any) {
    console.error('Draft Error:', e);
    return res.status(500).json({ error: `Database Error: ${e.message}`, details: e.details || e.hint });
  }
});

export default router;