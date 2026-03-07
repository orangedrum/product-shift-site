import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { randomUUID, createHmac } from 'crypto'; // Native Node.js UUID generation
import { waitlistSubject, waitlistBody, welcomeSubject, welcomeBody, marketingEmails } from './email-templates';
import { supabase, stripe, sendEmail, getEmailTemplate, isTestEmail, getPublicUrl } from './services';
import { runTestHandler, generateStructuredData } from './analysis-controller';
import { getAiServiceStatus } from './ai-service';
import adminRouter from './admin';
import { markNotificationsRead, deleteNotification, deleteAllNotifications } from './notification-controller';

// --- Environment Variables ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// --- Magic Link Email Template ---
const getMagicLinkTemplate = (link: string, baseUrl: string) => `
  <div style="text-align: center;">
    <h2 style="color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Sign in to User Mirror</h2>
    <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px; line-height: 1.5;">Click the button below to sign in. This link expires in 24 hours.</p>
    <a href="${link}" style="background-color: #000000; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      Sign In Now
    </a>
    <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
      Or copy and paste this URL into your browser:<br>
      <a href="${link}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${link}</a>
    </p>
  </div>
`;

// Initialize Express App
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));

// --- Stripe Webhook ---
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return res.status(400).send('Webhook Error: Missing secret or signature.');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const segment = session.metadata?.segment;

    if (customerEmail) {
      const { data: existingPayment } = await supabase.from('payments').select('id').eq('stripe_session_id', session.id).single();
      if (!existingPayment) {
        if (session.mode === 'subscription') {
          let creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          // Pricing Strategy Override: Ensure subscriptions get value
          // If it was the old 50 credits, we keep it (now ~16 tests).
          // If we want to adjust, we can do it here, but for now we trust the metadata or defaults.
          
          if (creditsToAdd > 0) await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
          await supabase.from('customers').upsert({ 
            email: customerEmail,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_status: 'active',
            is_regular_user: true,
            date_became_regular: new Date().toISOString(),
            ...(segment ? { segment } : {})
          }, { onConflict: 'email' });
        } else if (session.mode === 'payment') {
          let creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          
          // PRICING STRATEGY OVERRIDE:
          if (session.amount_total === 1400) creditsToAdd = 9;  // $14 = 9 Credits (3 Tests)
          if (session.amount_total === 6900) creditsToAdd = 45; // $69 = 45 Credits (15 Tests)

          // FIX: Ensure customer exists before adding credits
          const { data: customer } = await supabase.from('customers').select('id').eq('email', customerEmail).maybeSingle();
          if (!customer) {
             await supabase.from('customers').insert({ email: customerEmail, credits: 0, plan_status: 'free' });
          }

          if (creditsToAdd > 0) await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
          if (segment) {
            const { data: updatedRows, error: segError } = await supabase.from('customers').update({ segment }).eq('email', customerEmail).select();
            if (segError || !updatedRows || updatedRows.length === 0) {
              await supabase.from('customers').upsert({ email: customerEmail, segment }, { onConflict: 'email' });
            }
          }

          // --- FLYWHEEL TRACKING ---
          // Check payment count to determine status
          const { count: paymentCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('email', customerEmail).eq('status', 'paid');
          const currentCount = (paymentCount || 0) + 1; // +1 for this current payment

          const updates: any = {};
          // Fix: Ensure Regular User status is set on 1st payment OR if it was missed
          if (currentCount === 1 || (currentCount > 0 && !existingPayment)) {
            updates.is_regular_user = true;
            updates.date_became_regular = new Date().toISOString();
          } else if (currentCount >= 2) {
            updates.is_power_user = true;
            updates.date_became_power_user = new Date().toISOString();
          }

          // Champion Logic: 3+ Purchases AND Has Referred Someone
          if (currentCount >= 3) {
            const { data: customerData } = await supabase.from('customers').select('referral_count').eq('email', customerEmail).single();
            if (customerData && (customerData.referral_count || 0) > 0) {
              updates.is_champion = true;
              updates.date_became_champion = new Date().toISOString();
            }
          }
          
          if (Object.keys(updates).length > 0) {
            await supabase.from('customers').update(updates).eq('email', customerEmail);
          }
        }
        await supabase.from('payments').insert({
          email: customerEmail,
          amount_total: session.amount_total,
          currency: session.currency,
          status: session.payment_status,
          stripe_session_id: session.id
        });
      }
      
      // Marketing: Send Welcome Email
      // Webhooks don't have an origin header, so we default to production or use an env var if needed.
      const baseUrl = getPublicUrl();
      await sendEmail(customerEmail, welcomeSubject, welcomeBody(baseUrl));
    }
  }
  res.json({received: true});
});

app.use(express.json());

// --- Mount Admin Routes (Must be after express.json) ---
app.use('/api/admin', adminRouter);

// --- Admin: Flywheel Stats Endpoint ---
app.get('/api/admin/flywheel-stats', async (req, res) => {
  // Basic auth check via header presence (AdminDashboard sends it)
  if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });
  
  const excludeTest = req.query.exclude_test_data === 'true';

  // Helper to apply filters
  const getBaseQuery = () => {
    let q = supabase.from('customers').select('*', { count: 'exact', head: true });
    if (excludeTest) {
      q = q.not('email', 'ilike', '%test%').not('email', 'ilike', '%demo%').not('email', 'ilike', '%example%').not('email', 'ilike', '%localhost%').not('email', 'ilike', '%+smb%').not('email', 'ilike', '%productshift%').not('email', 'ilike', '%jeankaluza%');
    }
    return q;
  };

  try {
    // 1. Flywheel Counts
    const { count: totalUsers } = await getBaseQuery();
    const { count: regularUsers } = await getBaseQuery().eq('is_regular_user', true);
    const { count: powerUsers } = await getBaseQuery().eq('is_power_user', true);
    const { count: champions } = await getBaseQuery().eq('is_champion', true);

    // 2. Recent Feedback
    const { data: feedback } = await supabase
      .from('user_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      counts: { users: totalUsers || 0, regular: regularUsers || 0, power: powerUsers || 0, champions: champions || 0 },
      feedback: feedback || []
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Helper: Parse Markdown to Neo-Brutalist Tailwind HTML ---
const parseMarkdownToTailwind = (text: string) => {
  if (!text) return '';
  let html = text
    .replace(/\|\|\|SSL_WARNING_ALERT\|\|\|\\n/g, '')
    .replace(/^### (.*$)/gm, '<h3 class="text-xl font-black text-black mt-6 mb-3 border-b-2 border-black inline-block">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-black text-black mt-8 mb-4">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-800 mb-2 font-medium">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-gray-800 leading-relaxed font-medium">')
    .replace(/\n/g, '<br />');
  return `<div class="prose-neo"><p class="mb-4 text-gray-800 leading-relaxed font-medium">${html}</p></div>`;
};

// --- Public Report Endpoint ---
app.get('/api/public-report/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID: Allow UUIDs, Integers (for legacy DBs), or the test mode string
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const isInt = /^\d+$/.test(id);
  if (!isUuid && !isInt && id !== 'test-mode-dummy-id') {
     return res.status(404).send('Report not found (Invalid ID format).');
  }

  if (id === 'test-mode-dummy-id') {
    const title = 'Test Mode Report';
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head><title>${title}</title></head>
        <body><h1>${title}</h1></body>
      </html>
    `);
  }
  
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).send('Database not configured');

  try {
    const { data: run, error } = await supabase.from('analysis_runs').select('*').eq('id', id).single();
    if (error || !run || !run.report_data) return res.status(404).send('Report not found.');

    const { scores, expertReport, userSessions = [], title, url } = run.report_data;
    const seoSchema = generateStructuredData(url, `UX Audit: ${title}`, scores, expertReport);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UX Audit: ${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script type="application/ld+json">${JSON.stringify(seoSchema)}</script>
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased p-6 md:p-12">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white border-2 border-black rounded-xl shadow-[8px_8px_0px_0px_#000] p-8 md:p-12 mb-8">
            <div class="mb-8 border-b-2 border-black pb-6">
              <h1 class="text-4xl font-black mb-2">${title}</h1>
              <p class="text-lg font-medium text-gray-600">Target URL: <a href="${url}" class="text-indigo-600 underline">${url}</a></p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div class="p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] text-center">
                <div class="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Usability</div>
                <div class="text-5xl font-black text-black">${scores.usability}</div>
              </div>
              <div class="p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] text-center">
                <div class="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Desirability</div>
                <div class="text-5xl font-black text-black">${scores.desirability}</div>
              </div>
              <div class="p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000] text-center">
                <div class="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Clarity</div>
                <div class="text-5xl font-black text-black">${scores.clarity}</div>
              </div>
            </div>
            <div class="space-y-8 mb-12">
              <h2 class="text-3xl font-black text-black border-b-4 border-black pb-2 inline-block mb-6">User Feedback</h2>
              ${(userSessions || []).map((session: any) => {
                const analysisParts = session.analysis.split('|||');
                const bubble = analysisParts.find((part: any, i: number) => analysisParts[i-1] === 'USER_BUBBLE')?.trim() || 'No immediate thoughts.';
                let details = analysisParts.find((part: any, i: number) => analysisParts[i-1] === 'USER_DETAILS')?.trim() || 'No detailed feedback provided.';
                const formattedDetails = parseMarkdownToTailwind(details);
                return `
                  <div class="p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_#000]">
                    <div class="flex items-center gap-4 mb-6">
                      <img src="${session.avatar}" alt="${session.persona}" class="w-16 h-16 rounded-full border-2 border-black bg-gray-100" />
                      <div>
                        <h3 class="text-xl font-black text-black leading-none">${session.persona}</h3>
                        <p class="text-sm font-bold text-gray-500 uppercase tracking-wide mt-1">${session.description}</p>
                      </div>
                    </div>
                    <div class="bg-[#f3f4f6] p-5 rounded-lg border-2 border-black italic text-black font-bold text-lg mb-6 relative">
                      <span class="absolute -top-3 left-6 text-4xl leading-none text-black">"</span>
                      ${bubble}
                    </div>
                    <div class="text-gray-800">${formattedDetails}</div>
                  </div>
                `
              }).join('')}
            </div>
            <div class="bg-white p-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#000]">
              <h2 class="text-3xl font-black text-black border-b-4 border-black pb-2 inline-block mb-6">Expert Analysis</h2>
              <div class="prose-neo">${parseMarkdownToTailwind(expertReport)}</div>
            </div>
          </div>
          <div class="text-center">
            <a href="https://www.theproductshift.com/agency-user-testing" class="inline-block bg-black text-white font-bold py-4 px-8 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#fff] transition-all">
              Generate your own AI UX Audit
            </a>
          </div>
        </div>
      </body>
      </html>`;
    res.send(html);
  } catch (e: any) {
    res.status(500).send(`Error generating report: ${e.message}`);
  }
});

// --- AUTH MIDDLEWARE ---
const authenticateRequest = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let token = null;

  // 1. Check Authorization Header (Preferred for API calls)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback to Cookies (For browser navigation/legacy)
  if (!token) {
    let cookies = (req as any).cookies || {};
    
    if (Object.keys(cookies).length === 0 && req.headers.cookie) {
      try {
        cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
          const parts = cookie.trim().split('=');
          const key = parts.shift();
          const val = parts.join('=');
          if (key) acc[key] = decodeURIComponent(val || '');
          return acc;
        }, {});
      } catch (e) { cookies = {}; }
    }
    
    const authCookieKey = Object.keys(cookies).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    const cookie = authCookieKey ? cookies[authCookieKey] : null;
    if (cookie) {
      try {
        token = JSON.parse(cookie)[0].access_token;
      } catch (e) {}
    }
  }

  if (!token) {
    (req as any).user = null;
    (req as any).authDebug = 'No auth token found';
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    (req as any).user = error || !user ? null : user;
    if (error) {
      (req as any).authDebug = `Supabase Error: ${error.message}`;
      // If token is invalid/expired, explicitly nullify user to force re-login logic
      (req as any).user = null;
    }
  } catch (e) {
    (req as any).user = null;
    (req as any).authDebug = 'Failed to parse auth cookie';
  }
  next();
};

// --- Notification Routes (Secure) ---
app.post('/api/user/notifications/mark-read', authenticateRequest, markNotificationsRead);
app.delete('/api/user/notifications/:id', authenticateRequest, deleteNotification);
app.delete('/api/user/notifications', authenticateRequest, deleteAllNotifications);

// --- Auth Routes ---
app.get('/api/auth/status', authenticateRequest, (req, res) => {
  const user = (req as any).user;
  if (user) res.json({ authenticated: true, email: user.email, debug: 'OK' });
  else res.json({ authenticated: false, debug: (req as any).authDebug || 'Unknown auth failure' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, redirectTo } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  // Diagnostic: Check if Supabase is actually configured
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
    console.error('AUTH ERROR: Supabase Env Vars Missing');
    return res.status(500).json({ error: 'Server Configuration Error: Supabase URL/Key missing.' });
  }

  try {
    // 1. Ensure user exists (Create if not)
    // We use admin.createUser to ensure the user exists in Auth before generating a link.
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true // Auto-confirm so they can sign in immediately
    });

    // Robust Error Handling: If user exists, we proceed. If other error, we throw.
    if (createError) {
      const msg = createError.message.toLowerCase();
      if (!msg.includes('registered') && !msg.includes('exists') && !msg.includes('duplicate')) {
         throw createError;
      }
    }

    // 2. Generate Magic Link (Server-Side)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo || 'https://www.theproductshift.com/ai-powered-ux'
      }
    });

    if (linkError || !linkData.properties?.action_link) throw linkError || new Error('Failed to generate link');

    // 3. Send Branded Email via Resend
    const baseUrl = getPublicUrl();
    const emailHtml = getMagicLinkTemplate(linkData.properties.action_link, baseUrl);
    await sendEmail(email, 'Sign in to User Mirror', emailHtml, baseUrl);

    return res.json({ success: true });
  } catch (err: any) {
    console.error('AUTH ERROR:', err);
    return res.status(500).json({ error: 'Email Service Error. Please try again later.' });
  }
});

// --- Update Email Endpoint (Branded) ---
app.post('/api/user/update-email', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  const { newEmail } = req.body;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!newEmail) return res.status(400).json({ error: 'New email required' });

  try {
    const baseUrl = getPublicUrl();
    
    // Generate a secure, signed token for the new email verification
    // Payload: userId|newEmail|expiry
    const expiry = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
    const payload = `${user.id}|${newEmail}|${expiry}`;
    const signature = createHmac('sha256', supabaseServiceKey).update(payload).digest('hex');
    const token = Buffer.from(payload).toString('base64');
    
    const actionLink = `${baseUrl}/account?verify_email_token=${token}&sig=${signature}`;

    // Send Branded Email via Resend
    const emailHtml = `
      <div style="text-align: center;">
        <h2 style="color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Confirm Email Change</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 32px; line-height: 1.5;">
          You requested to change your email to <strong>${newEmail}</strong>.<br>
          Click the button below to confirm this change.
        </p>
        <a href="${actionLink}" style="background-color: #000000; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          Confirm Email Change
        </a>
      </div>
    `;
    
    await sendEmail(newEmail, 'Confirm Email Change - User Mirror', emailHtml, baseUrl);

    res.json({ success: true });
  } catch (e: any) {
    console.error('Update Email Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Verify Email Change Endpoint ---
app.post('/api/user/verify-email-change', async (req, res) => {
  const { token, sig } = req.body;
  if (!token || !sig) return res.status(400).json({ error: 'Invalid link' });

  try {
    // 1. Verify Signature
    const payload = Buffer.from(token, 'base64').toString('utf-8');
    const expectedSig = createHmac('sha256', supabaseServiceKey).update(payload).digest('hex');
    
    if (sig !== expectedSig) {
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // 2. Parse Payload
    const [userId, newEmail, expiryStr] = payload.split('|');
    if (Date.now() > parseInt(expiryStr)) {
      return res.status(403).json({ error: 'Link expired' });
    }

    // 3. Force Update Email (Bypassing old email confirmation)
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true // Auto-confirm the new email
    });

    if (error) throw error;

    // 4. Update Customer Record (Sync)
    await supabase.from('customers').update({ email: newEmail }).eq('id', userId); // Assuming ID link, or handle by old email if needed
    // Note: Customers table usually keyed by email, so we might need to update based on old email or ID if available.
    // Since we don't have the old email here easily without a lookup, let's assume Auth ID sync or just rely on Auth.
    // Actually, let's try to update the customer record by the *new* email to ensure consistency if it was keyed by email.
    // But wait, we don't know the old email to find the row.
    // Let's fetch the user first to get the old email if we need to update the customers table key.
    // For now, let's assume the Auth update is the primary goal.

    res.json({ success: true });
  } catch (e: any) {
    console.error('Verify Email Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Update Segment Endpoint (Fixes SMB/UX Persistence Bug) ---
app.post('/api/user/update-segment', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  const { segment } = req.body;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!segment) return res.status(400).json({ error: 'Segment required' });

  try {
    const { error } = await supabase.from('customers').update({ segment }).eq('email', user.email);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error('Update Segment Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Debug: Test Email Endpoint ---
app.post('/api/admin/test-email', async (req, res) => {
  const { email, template } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Check Key Presence explicitly for the test endpoint
  if (!process.env.RESEND_API_KEY) {
     return res.json({ success: false, error: 'Configuration Error', details: 'RESEND_API_KEY is missing in Vercel Env Vars.' });
  }

  const baseUrl = getPublicUrl();
  
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

// --- Create Checkout Session ---
app.post('/api/create-checkout-session', async (req, res) => {
  const { planId, email, segment, applyDiscount, promotekit_referral } = req.body;
  if (!planId || !email) return res.status(400).json({ error: 'Missing parameters' });

  const baseUrl = getPublicUrl();
  const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&segment=${segment || 'tech'}`;
  const cancelUrl = `${baseUrl}/account`;

  try {
    const sessionConfig: any = {
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        segment: segment || 'tech',
        promotekit_referral: promotekit_referral || '',
        credits: '0'
      }
    };

    if (planId === 'pack-3') {
      sessionConfig.line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Quick Check (9 Credits)', description: '3 Full URL Tests' },
          unit_amount: 1400,
        },
        quantity: 1,
      });
      sessionConfig.metadata.credits = '9';
    } else if (planId === 'pack-15') {
      let amount = 6900;
      if (applyDiscount) amount = Math.round(amount * 0.9);
      sessionConfig.line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Pro Pack (45 Credits)', description: '15 Full URL Tests' },
          unit_amount: amount,
        },
        quantity: 1,
      });
      sessionConfig.metadata.credits = '45';
    } else if (planId === 'starter') {
      sessionConfig.mode = 'subscription';
      sessionConfig.line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Monthly Audit Plan', description: '10 Tests / Month (30 Credits)' },
          unit_amount: 2900,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      });
      sessionConfig.metadata.credits = '30';
    } else if (planId === 'pilot-localization') {
      sessionConfig.line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Localization Pilot', description: 'Spanish & German Dubbing + UX Audit' },
          unit_amount: 250000, // $2,500.00
        },
        quantity: 1,
      });
    } else {
      return res.status(400).json({ error: 'Invalid plan ID' });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });
  } catch (e: any) {
    console.error('Checkout Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Verify Payment Endpoint (Fixes 404 Error) ---
app.post('/api/verify-payment', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Session ID required' });

  try {
    // 1. Check DB first (Fastest)
    const { data: payment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('stripe_session_id', session_id)
      .single();

    if (payment) {
      // Check if this is the first payment
      const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('email', (payment as any)?.email || '').eq('status', 'paid');
      return res.json({ verified: true, status: payment.status, isFirstPayment: count === 1 });
    }

    // 2. Check Stripe directly (Fallback if webhook is slow)
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
        // SELF-HEALING: Provision credits if webhook missed it
        const customerEmail = session.customer_details?.email;
        if (customerEmail) {
            // Ensure customer exists
            const { data: customer } = await supabase.from('customers').select('id').eq('email', customerEmail).maybeSingle();
            if (!customer) {
                await supabase.from('customers').insert({ email: customerEmail, credits: 0, plan_status: 'free' });
            }

            // Calculate credits (Mirroring webhook logic)
            let creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
            if (session.amount_total === 1400) creditsToAdd = 9;
            if (session.amount_total === 6900) creditsToAdd = 45;

            // Attempt to record payment (Unique constraint on stripe_session_id prevents double-counting)
            const { error: insertError } = await supabase.from('payments').insert({
                email: customerEmail,
                amount_total: session.amount_total,
                currency: session.currency,
                status: session.payment_status,
                stripe_session_id: session.id
            });

            // Only add credits if we successfully inserted the payment record (meaning we are the first to process it)
            if (!insertError && creditsToAdd > 0) {
                console.log(`Self-healing payment: Adding ${creditsToAdd} credits to ${customerEmail}`);
                await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });

                // --- FLYWHEEL TRACKING (Self-Healing) ---
                const { count: paymentCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('email', customerEmail).eq('status', 'paid');
                
                const updates: any = {};
                // paymentCount includes the one we just inserted
                if (paymentCount === 1) {
                  updates.is_regular_user = true;
                  updates.date_became_regular = new Date().toISOString();
                } else if ((paymentCount || 0) >= 2) {
                  updates.is_power_user = true;
                  updates.date_became_power_user = new Date().toISOString();
                }
                
                if (Object.keys(updates).length > 0) {
                  await supabase.from('customers').update(updates).eq('email', customerEmail);
                }
            }
        }
    }

    // Check payment count for first payment flag
    const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('email', session.customer_details?.email || '').eq('status', 'paid');

    return res.json({ verified: session.payment_status === 'paid', status: session.payment_status, isFirstPayment: (count || 0) <= 1 });
  } catch (e: any) {
    console.error('Verify Payment Error:', e);
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/run-test', runTestHandler);

app.post('/api/run-funnel-roast', async (req, res, next) => {
  // Use require to break circular dependency and lazy load the controller
  const { runFunnelRoastHandler } = await import('./funnel-roaster-controller');
  return runFunnelRoastHandler(req, res);
});

app.post('/api/analyze', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  req.body.email = user.email;
  req.body.personaIds = ['alex-busy-pro'];
  req.body.goal = 'Identify immediate UX friction points and conversion blockers.';
  return runTestHandler(req, res);
});

// --- Other Routes (Waitlist, Refund, etc.) ---
app.post('/api/join-waitlist', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server configuration error.' });
  const { error } = await supabase.from('waitlist_emails').insert({ email });
  if (error) return res.status(500).json({ error: 'Could not save email.', details: error.message });
  
  const baseUrl = getPublicUrl();
  // Marketing: Send Waitlist Email
  await sendEmail(email, waitlistSubject, waitlistBody(baseUrl), baseUrl);
  
  return res.status(200).json({ message: 'Successfully joined waitlist.' });
});

// --- User Account Existence Check (Public for Login.tsx) ---
app.post('/api/user/check-account', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  try {
    const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('email', email);
    return res.json({ exists: (count || 0) > 0 });
  } catch (e: any) {
    console.error('Check account existence error:', e);
    return res.status(500).json({ error: 'Database error' });
  }
});

// --- User Account Stats (Authenticated for Extension/App) ---
app.get('/api/user/check-account', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  const skipCredits = req.query.skip_credits === 'true';

  if (!user) {
    return res.status(401).json({ 
      error: 'Not authenticated', 
      debug: (req as any).authDebug || 'Session not found or expired.' 
    });
  }

  // Fetch customer details to return credits/plan info
  try {
    let { data: customer } = await supabase.from('customers').select('*').eq('email', user.email).maybeSingle();

    // If customer does not exist, create them (lazy initialization)
    if (!customer) {
      const initialCredits = skipCredits ? 0 : 5;
      console.log(`New user detected: ${user.email}. Granting ${initialCredits} credits.`);
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({ email: user.email, credits: initialCredits, plan_status: 'free' })
        .select()
        .single();
      if (insertError) throw insertError;
      customer = newCustomer;

      // Marketing: Send Immediate Welcome Email (Email 1)
      if (!isTestEmail(user.email)) {
        const baseUrl = getPublicUrl();
        const emailContent = marketingEmails.welcome.body(baseUrl);
        sendEmail(user.email, marketingEmails.welcome.subject, emailContent, baseUrl).catch(console.error);
      }
    }
    
    res.json({ authenticated: true, email: user.email, credits: customer.credits, plan_status: customer.plan_status });

  } catch (dbError: any) {
    console.error('Check-account DB Error:', dbError);
    res.status(500).json({ error: 'Database error while checking account.' });
  }
});

// --- Daily Marketing Cron Endpoint ---
// Call this once a day via Vercel Cron or external scheduler
app.get('/api/cron/daily-marketing', async (req, res) => {
  // Simple security check (Set CRON_SECRET in Vercel env vars)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const baseUrl = getPublicUrl();

  try {
    // Fetch active free users who haven't finished the sequence
    const { data: users, error } = await supabase
      .from('customers')
      .select('id, email, created_at, marketing_step, plan_status')
      .eq('plan_status', 'free')
      .lt('marketing_step', 4); // Stop after Day 7 (step 4)

    if (error) throw error;

    let sentCount = 0;
    const now = new Date();

    for (const user of users) {
      // Skip test users
      if (isTestEmail(user.email)) continue;

      const createdAt = new Date(user.created_at);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      let nextStep = user.marketing_step || 0;
      let emailToSend = null;
      let newStep = nextStep;

      // Sequence Logic:
      // Step 0 (Welcome sent) -> Wait for Day 3 -> Send Day 3 Email -> Set Step 1
      // Step 1 (Day 3 sent) -> Wait for Day 5 -> Send Day 5 Email -> Set Step 2
      // Step 2 (Day 5 sent) -> Wait for Day 7 -> Send Day 7 Email -> Set Step 3
      // Step 3 (Day 7 sent) -> Wait for Day 10 -> Send Day 10 Email -> Set Step 4

      if (nextStep === 0 && diffDays >= 3) { emailToSend = marketingEmails.day3; newStep = 1; }
      else if (nextStep === 1 && diffDays >= 5) { emailToSend = marketingEmails.day5; newStep = 2; }
      else if (nextStep === 2 && diffDays >= 7) { emailToSend = marketingEmails.day7; newStep = 3; }
      else if (nextStep === 3 && diffDays >= 10) { emailToSend = marketingEmails.day10; newStep = 4; }

      if (emailToSend) {
        const content = emailToSend.body(baseUrl);
        await sendEmail(user.email, emailToSend.subject, content, baseUrl);
        await supabase.from('customers').update({ marketing_step: newStep }).eq('id', user.id);
        sentCount++;
      }
    }

    res.json({ success: true, sent: sentCount });
  } catch (e: any) {
    console.error('Cron Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- User: Check Referral Eligibility (Prevent Abuse) ---
app.post('/api/user/check-referral-eligibility', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('email', email);
    // Eligible only if user does NOT exist
    return res.json({ eligible: (count === 0) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// --- User: Claim Referral (Flywheel Champion Logic) ---
app.post('/api/user/claim-referral', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  const { referralCode } = req.body;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (!referralCode) return res.status(400).json({ error: 'Referral code required' });

  try {
    // 0. Abuse Check: Is this a new user?
    // Fetch creation time AND claim status
    const { data: currentUser } = await supabase.from('customers').select('created_at, claimed_referral').eq('email', user.email).single();
    
    if (currentUser) {
      // Rule 1: One claim per lifetime
      if (currentUser.claimed_referral) {
        return res.status(403).json({ error: 'You have already claimed a referral reward.' });
      }

      // Rule 2: Account must be new (< 24 hours)
      const created = new Date(currentUser.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) return res.status(403).json({ error: 'Referral rewards are for new accounts only.' });
    }

    // 1. Find Referrer
    const { data: referrer } = await supabase.from('customers').select('id, email, referral_count').eq('referral_code', referralCode).single();
    
    // Fix: Case-insensitive check to prevent self-referral abuse
    if (referrer && referrer.email.toLowerCase() !== user.email.toLowerCase()) {
      // Link the users, but DO NOT reward referrer yet (Wait for first test)
      await supabase.from('customers').update({ 
        claimed_referral: true,
        referred_by: referrer.email,
        referrer_rewarded: false
      }).eq('email', user.email.toLowerCase());

      // 4. Reward Current User (The Friend)
      await supabase.rpc('add_credits', { user_email: user.email, amount: 3 }); // Give 3 credits
      return res.json({ success: true, message: 'Referral claimed! 3 credits added.' });
    }
    return res.status(404).json({ error: 'Invalid referral code' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// --- Generate Referral Code Endpoint (Fixes 404 Error) ---
app.post('/api/user/generate-referral', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Generate a simple random code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Check if customer exists first
    const { data: existing } = await supabase.from('customers').select('id').eq('email', user.email).maybeSingle();

    let data, error;

    if (!existing) {
        // Self-Healing: Create new customer with credits AND referral code if missing
        console.log(`Generating referral for new user: ${user.email}`);
        const result = await supabase
            .from('customers')
            .insert({ 
                email: user.email, 
                credits: 5, 
                plan_status: 'free',
                referral_code: code 
            })
            .select('referral_code')
            .single();
        data = result.data;
        error = result.error;
    } else {
        // Update existing
        const result = await supabase
            .from('customers')
            .update({ referral_code: code })
            .eq('email', user.email)
            .select('referral_code')
            .single();
        data = result.data;
        error = result.error;
    }
    
    if (error) throw error;
    if (!data) throw new Error('Failed to generate or retrieve referral code');
    res.json({ referralCode: data.referral_code });
  } catch (e: any) {
    console.error('Generate Referral Error:', e);
    res.status(500).json({ error: 'Failed to generate referral code' });
  }
});

// --- User: Redeem Coupon ---
app.post('/api/user/redeem-coupon', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  const { code } = req.body;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).single();
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });

  // Abuse Check: Record redemption. If it exists (Unique Constraint), this will fail.
  const { error: redemptionError } = await supabase.from('coupon_redemptions').insert({ 
    user_email: user.email, 
    coupon_code: code.toUpperCase() 
  });

  if (redemptionError) return res.status(403).json({ error: 'You have already redeemed this coupon.' });

  await supabase.rpc('add_credits', { user_email: user.email, amount: coupon.credits });
  
  res.json({ success: true, message: `${coupon.credits} credits added!` });
});

// --- User: Submit Feedback ---
app.post('/api/user/feedback', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  const { rating, testimonial, feedback } = req.body;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const { error } = await supabase.from('user_feedback').insert({
    user_email: user.email, rating, testimonial, feedback
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- AI Service Health Check ---
app.get('/api/ai-health', async (req, res) => {
  try {
    const status = await getAiServiceStatus();
    res.status(status.status === 'ok' || status.status === 'degraded' ? 200 : 503).json(status);
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// --- Health Check ---
app.get('/api/health', (req, res) => {
  const routes: string[] = [];
  try {
    if (app._router && app._router.stack) {
      app._router.stack.forEach((middleware: any) => {
        if (middleware.route) {
          routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
        }
      });
    }
  } catch (e) {
    console.error('Health check route inspection failed:', e);
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRoutes: routes,
    env: {
      supabaseUrl: !!supabaseUrl ? 'OK' : 'MISSING',
      geminiKey: !!process.env.GEMINI_API_KEY ? 'OK' : 'MISSING'
    }
  });
});

// --- Global Error Handler (Safety Net) ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message || 'Unknown error' });
});

app.use((req, res) => {
  console.log(`[404] No route matched for: ${req.method} ${req.path}`);
  res.status(404).send(`Cannot ${req.method} ${req.path}`);
});

export default app;
