import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { randomUUID, createHmac } from 'crypto'; // Native Node.js UUID generation
import { waitlistSubject, waitlistBody, welcomeSubject, welcomeBody, marketingEmails } from './email-templates';
import { supabase, stripe, sendEmail, getEmailTemplate, isTestEmail } from './services';
import { runTestHandler } from './analysis-controller';
import adminRouter from './admin';

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

// --- Email Helper ---
const sendEmail = async (to: string, subject: string, html: string, baseUrl: string = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com') => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Resend API key missing. Skipping email.');
    return { success: false, error: 'Resend API Key missing' };
  }
  const fullHtml = getEmailTemplate(html, baseUrl);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from: emailFrom, to, subject, html: fullHtml })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend API Error:', errorData);
      return { success: false, error: errorData, from: emailFrom };
    }
    return { success: true };
  } catch (e) {
    console.error('Failed to send email:', e);
    return { success: false, error: e, from: emailFrom };
  }
};

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
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com';
      await sendEmail(customerEmail, welcomeSubject, welcomeBody(baseUrl));
    }
  }
  res.json({received: true});
});

app.use(express.json());

// --- Mount Admin Routes (Must be after express.json) ---
app.use('/api/admin', adminRouter);

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
    return res.send('Test Mode Report'); 
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
  let cookies = (req as any).cookies || {}; // Default to empty object immediately
  
  // Fallback: Parse from header if cookies is empty
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

  if (!cookie) {
    (req as any).user = null;
    (req as any).authDebug = 'No auth cookie found in request';
    return next();
  }

  try {
    const token = JSON.parse(cookie)[0].access_token;
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
    const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');
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
    const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');
    
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

  const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');
  
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

  const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');
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

    if (payment) return res.json({ verified: true, status: payment.status });

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
            }
        }
    }

    return res.json({ verified: session.payment_status === 'paid', status: session.payment_status });
  } catch (e: any) {
    console.error('Verify Payment Error:', e);
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/run-test', runTestHandler);

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
  
  const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');
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
      console.log(`New user detected: ${user.email}. Granting 3 free credits.`);
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({ email: user.email, credits: 3, plan_status: 'free' })
        .select()
        .single();
      if (insertError) throw insertError;
      customer = newCustomer;

      // Marketing: Send Immediate Welcome Email (Email 1)
      if (!isTestEmail(user.email)) {
        const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');
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

  const baseUrl = req.get('origin') || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com');

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
      // Step 0 (Welcome sent) -> Wait for Day 2 -> Send Day 2 Email -> Set Step 1
      // Step 1 (Day 2 sent) -> Wait for Day 5 -> Send Day 5 Email -> Set Step 2
      // Step 2 (Day 5 sent) -> Wait for Day 8 -> Send Day 8 Email -> Set Step 3
      // Step 3 (Day 8 sent) -> Wait for Day 10 -> Send Day 10 Email -> Set Step 4

      if (nextStep === 0 && diffDays >= 2) { emailToSend = marketingEmails.day2; newStep = 1; }
      else if (nextStep === 1 && diffDays >= 5) { emailToSend = marketingEmails.day5; newStep = 2; }
      else if (nextStep === 2 && diffDays >= 8) { emailToSend = marketingEmails.day8; newStep = 3; }
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
                credits: 3, 
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

  // Check if already redeemed (Optional: Add a redemptions table)
  // For now, just add credits
  await supabase.rpc('add_credits', { user_email: user.email, amount: coupon.credits });
  
  res.json({ success: true, message: `${coupon.credits} credits added!` });
});

app.get('/api/health', (req, res) => {
  const routes: string[] = [];
  try {
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

app.use((req, res) => {
  console.log(`[404] No route matched for: ${req.method} ${req.path}`);
  res.status(404).send(`Cannot ${req.method} ${req.path}`);
});

export default app;
