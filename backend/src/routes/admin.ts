import express from 'express';
import { supabase, sendEmail, isTestEmail } from '../services';
import { generateStructuredData } from '../analysis-controller';
import { generateEnhancedContent } from '../ai-service';
import { marketingEmails } from '../email-templates';

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

  try {
    // 1. Counts (With Filter Support)
    let testsQuery = supabase.from('analysis_runs').select('*', { count: 'exact', head: true });
    let usersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });

    if (excludeTest) {
      usersQuery = usersQuery.not('email', 'ilike', '%test%').not('email', 'ilike', '%demo%');
      testsQuery = testsQuery.not('user_identifier', 'ilike', '%test%').not('user_identifier', 'ilike', '%demo%');
    }

    const { count: totalTests } = await testsQuery;
    const { count: totalUsers } = await usersQuery;
    const { data: revenueData } = await supabase.from('payments').select('amount_total');
    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.amount_total || 0), 0) || 0;

    // 2. Lists (Recent Activity)
    const { data: recentPayments } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: recentErrors } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: recentRuns } = await supabase.from('analysis_runs').select('id, url, plan_type, created_at, user_identifier').order('created_at', { ascending: false }).limit(20);
    const { data: recentSubscribers } = await supabase.from('customers').select('id, email, plan_status, created_at').eq('plan_status', 'active').order('created_at', { ascending: false }).limit(10);

    // 3. Filter Test Data (if requested)
    const filter = (list: any[]) => excludeTest ? list.filter(item => !isTestEmail(item.email || item.user_identifier || '')) : list;

    res.json({
      totalTests: totalTests || 0,
      totalUsers: totalUsers || 0,
      totalRevenue: totalRevenue / 100,
      recentPayments: filter(recentPayments || []),
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
  
  const { error } = await supabase.from('customers').upsert({ 
    email, 
    credits: credits || 3, 
    segment: segment || 'tech',
    plan_status: 'free'
  }, { onConflict: 'email' });

  if (error) return res.status(500).json({ error: error.message });

  const baseUrl = 'https://www.theproductshift.com';
  const html = `
    <p>You've been invited to try User Mirror!</p>
    <p>We've loaded your account with <strong>${credits} credits</strong>.</p>
    <a href="${baseUrl}/login?segment=${segment}" style="background:#000;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">Accept Invite</a>
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