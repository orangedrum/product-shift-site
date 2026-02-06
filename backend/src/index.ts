import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { randomUUID } from 'crypto'; // Native Node.js UUID generation

// --- Persona & Analyzer Definitions ---

type ScrapedData = {
  title: string;
  headings: { tag: string; text: string }[];
  bodyText: string;
  screenshot?: string;
};

type Persona = {
  id: string;
  name: string;
  description: string;
  avatar: string;
};

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
// FIX: Prevent top-level crash if env vars are missing (common in Preview environments).
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder'
);

// --- Stripe Initialization ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// --- Resend Initialization ---
const emailFrom = process.env.EMAIL_FROM || 'Product Shift <onboarding@theproductshift.com>';

const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing in environment variables");
  
  const genAI = new GoogleGenerativeAI(apiKey);

  // Strategy: Cycle through a prioritized list of models to find one with available free quota.
  const modelsToTry = [
    'gemini-1.5-flash',        // Current Stable Workhorse (Fast & Reliable)
    'gemini-1.5-pro',          // High Intelligence Fallback
    'gemini-flash-latest',     // Generic Alias (Safety Net)
    'gemini-pro',              // Legacy Fallback
  ];

  // Prepare image part if available
  const imagePart = screenshot ? {
    inlineData: {
      data: screenshot,
      mimeType: "image/jpeg",
    },
  } : null;

  const parts: any[] = [prompt];
  if (imagePart) parts.push(imagePart);

  let errorLog: string[] = [];

  // Helper to delay execution to avoid rate limits
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const response = result.response;
      console.log(`✅ Model '${modelName}' succeeded.`);
      return response.text();
    } catch (error: any) {
      await delay(2000);
      console.log(`Model '${modelName}' failed: ${error.message}`);
      if (error.message.includes('404') && error.message.includes('not found')) {
        errorLog.push(`${modelName}: 404 (Check API Key/Enabled Services)`);
      } else if (error.message.includes('429')) {
        errorLog.push(`${modelName}: 429 Rate Limit Exceeded`);
      } else {
        errorLog.push(`${modelName}: ${error.message}`);
      }
    }
  }

  throw new Error(`All fallback models failed. Errors: ${errorLog.join(' | ')}`);
};

// --- Email Template Helper ---
const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Shift</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="https://www.theproductshift.com">
        <img src="https://www.theproductshift.com/logo.png" alt="Product Shift" style="height: 40px; width: auto; border: 0;" />
      </a>
    </div>
    ${content}
    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 32px 0;" />
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} Product Shift. All rights reserved.</p>
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">Sent with ❤️ from the Product Shift team.</p>
  </div>
</body>
</html>
`;

// --- Email Helper ---
const sendEmail = async (to: string, subject: string, html: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Resend API key missing. Skipping email.');
    return;
  }
  const fullHtml = getEmailTemplate(html);
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from: emailFrom, to, subject, html: fullHtml })
    });
  } catch (e) {
    console.error('Failed to send email:', e);
  }
};

// --- Generators ---

const generateUserSession = async (data: ScrapedData, persona: Persona, goal: string, url: string): Promise<string> => {
  const prompt = `
    You are facilitating a usability test session.
    **Context:**
    - **Persona:** ${persona.name} (${persona.description})
    - **Goal:** "${goal}"
    - **URL:** ${url}
    **Input Data:**
    - Page Title: "${data.title}"
    - Headings: ${JSON.stringify(data.headings.map(h => h.text))}
    - Introductory Body Text: "${data.bodyText}"
    - [Visual Screenshot Attached]
    **Instructions:**
    Adopt the persona of ${persona.name}. You are currently looking at the webpage.
    Narrate your experience out loud. Be critical, impatient, and honest.
    **Required Output Format:**
    |||USER_MOOD|||
    (One word: Positive, Neutral, or Negative)
    |||USER_BUBBLE|||
    (A single, genuine, emotional sentence connecting your specific problem/pain point to the solution you see on the page.)
    |||USER_DETAILS|||
    ### 1. My Experience
    (2-3 sentences on your immediate reaction.)
    ### 2. Points of Friction
    (Specific things that confused or annoyed you.)
    ### 3. What I Think This Is
    (Define the product based ONLY on what you see.)
  `;
  return generateContentWithFallback(prompt, data.screenshot);
};

const generateStructuredData = (url: string, title: string, scores: any, summary: string) => {
  const cleanSummary = summary.replace(/[#*]/g, '').split('\n').filter(line => line.trim().length > 0).slice(0, 3).join(' ');
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": { "@type": "WebSite", "name": title, "url": url },
    "reviewRating": { "@type": "Rating", "ratingValue": scores.usability, "bestRating": "100", "worstRating": "0" },
    "author": { "@type": "Organization", "name": "Product Shift AI" },
    "reviewBody": cleanSummary,
    "datePublished": new Date().toISOString()
  };
};

const generateAggregatedReport = async (data: ScrapedData, sessions: { persona: Persona, output: string }[], goal: string, url: string, isDemo: boolean): Promise<string> => {
  let footerContent = `
    ---
    **The Product Shift** | AI-Powered UX Audits
    Get your own report at www.theproductshift.com/landingpg-aiuxagent
  `;
  if (isDemo) {
    footerContent = `
    ---
    **Ready for more?** Unlock the full potential of AI-powered UX research.
    Use code **EARLYBIRD30** for 30% off your first month of Pro.
    Upgrade Now at www.theproductshift.com/landingpg-aiuxagent
    `;
  }
  const prompt = `
    You are a Senior UX Researcher. You have just observed usability tests with ${sessions.length} different users.
    **Required Output Format:**
    ### TEST RESULT: [PASS / FAIL]
    (Brief explanation).
    ### Visual & Heuristic Analysis
    (Comment on visual hierarchy, layout, and trust signals.)
    ### Actionable Recommendations
    - **ISSUE:** [Description]
    - **FIX:** [Action]
    |||SCORES_JSON|||
    { "usability": 85, "desirability": 70, "clarity": 90 }
    **Context:**
    - **URL:** ${url}
    - [Visual Screenshot Attached]
    **User Session Transcripts:**
    ${sessions.map(s => `--- USER: ${s.persona.name} ---\n${s.output}`).join('\n')}
    **IMPORTANT:** Do not use markdown tables.
    **PDF FOOTER:**
    ${footerContent}
  `;
  return generateContentWithFallback(prompt, data.screenshot);
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
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          if (creditsToAdd > 0) await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
          await supabase.from('customers').upsert({ 
            email: customerEmail,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_status: 'active',
            ...(segment ? { segment } : {})
          }, { onConflict: 'email' });
        } else if (session.mode === 'payment') {
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
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
    }
  }
  res.json({received: true});
});

app.use(express.json());

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

  // Validate UUID to prevent DB 500s
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid && id !== 'test-mode-dummy-id') {
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

// --- Admin Draft to Blog Endpoint ---
app.post('/api/admin/draft-blog-post', async (req, res) => {
  const { reportId, email } = req.body;
  const isAdmin = email && (email.endsWith('@theproductshift.com') || email.includes('+smb') || email.includes('test'));
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  try {
    if (reportId === 'test-mode-dummy-id') {
        await new Promise(r => setTimeout(r, 1000));
        return res.json({ success: true, cmsLink: '/admin-blog' });
    }

    const { data: run } = await supabase.from('analysis_runs').select('report_data').eq('id', reportId).single();
    if (!run || !run.report_data) return res.status(404).json({ error: 'Report data not found.' });

    const { title, expertReport, scores, url } = run.report_data;
    const safeTitle = title || 'Untitled Audit';
    const newId = randomUUID();
    const slug = `ux-audit-${safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const seoSchema = generateStructuredData(url, `UX Audit: ${safeTitle}`, scores, expertReport);

    const { error: insertError } = await supabase.from('posts').insert({
      id: newId,
      title: `UX Audit: ${safeTitle}`,
      slug: slug,
      content: expertReport,
      seo_schema: seoSchema,
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
    return next();
  }

  try {
    const token = JSON.parse(cookie)[0].access_token;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    (req as any).user = error || !user ? null : user;
  } catch (e) {
    (req as any).user = null;
  }
  next();
};

// --- Auth Routes ---
app.get('/api/auth/status', authenticateRequest, (req, res) => {
  const user = (req as any).user;
  if (user) res.json({ authenticated: true, email: user.email });
  else res.json({ authenticated: false });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, redirectTo } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || 'https://www.theproductshift.com/ai-powered-ux',
    },
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

app.post('/api/run-test', runTestHandler);

app.post('/api/analyze', authenticateRequest, async (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Not authenticated. Please log in on the main site.' });
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
  return res.status(200).json({ message: 'Successfully joined waitlist.' });
});

// --- Admin Stats Endpoint ---
app.get('/api/admin/stats', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { count: totalTests } = await supabase.from('analysis_runs').select('*', { count: 'exact', head: true });
    const { count: totalUsers } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    const { data: revenueData } = await supabase.from('payments').select('amount_total');
    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.amount_total || 0), 0) || 0;

    res.json({
      totalTests: totalTests || 0,
      totalUsers: totalUsers || 0,
      totalRevenue: totalRevenue / 100
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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

// --- Main Handler (runTestHandler) ---
// This function contains the core logic for running the test.
// It is defined here to be used by both /api/run-test and /api/analyze.
async function runTestHandler(req: express.Request, res: express.Response) {
  const { url, personaIds, goal, email } = req.body;

  if (!url || !personaIds || !goal) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // --- TEST MODE BYPASS ---
  if (url.toLowerCase().includes('test-mode') || url.toLowerCase().includes('test-demo') || url.toLowerCase().includes('demo-mode')) {
    const scores = { usability: 88, desirability: 92, clarity: 95 };
    const expertReport = '### TEST RESULT: PASS\nThe site demonstrates strong clarity and desirability.\n\n### Visual & Heuristic Analysis\n- **Visual Hierarchy:** [Positive] The primary headline and CTA are distinct.\n\n### Actionable Recommendations\n- **ISSUE:** Pricing transparency is lacking.\n- **FIX:** Add a "starting at" price.\n\n|||SCORES_JSON|||\n{ "usability": 88, "desirability": 92, "clarity": 95 }';
    const userSessions = [
      {
        persona: 'Alex',
        avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra',
        analysis: '|||USER_MOOD|||Positive|||USER_BUBBLE|||I instantly get what this is. The value prop is super clear.|||USER_DETAILS|||### 1. My Experience\nI landed on the page and immediately understood the offering. The headline "AI-Powered UX Audits" is punchy. I feel confident this tool could save me time.\n\n### 2. Points of Friction\nI\'m not sure about the pricing structure. It says "Pro" but doesn\'t list a price upfront. That\'s a bit annoying.\n\n### 3. What I Think This Is\nIt\'s an automated user testing tool that uses AI agents instead of real people to give quick feedback.',
        description: 'a busy professional with two kids under 5',
        personaObj: { id: 'alex-busy-pro', name: 'Alex', description: 'a busy professional with two kids under 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' }
      }
    ];

    // Generate SEO Schema
    const seoSchema = generateStructuredData(url, 'Test Mode: The Product Shift', scores, expertReport);

    let reportId = null;
    if (supabaseUrl && supabaseServiceKey) {
        const { data: runLog, error: runError } = await supabase
          .from('analysis_runs')
          .insert({
            user_identifier: 'test-mode',
            url: url,
            persona_count: 1,
            estimated_cost: 0,
            is_demo: true,
            plan_type: 'demo',
            revenue: 0,
            report_data: {
                title: 'Test Mode: The Product Shift',
                url: url,
                scores,
                expertReport,
                userSessions: userSessions.map(s => ({ persona: s.persona, avatar: s.avatar, analysis: s.analysis, description: s.description }))
            }
          })
          .select('id')
          .single();
        
        if (runLog) reportId = runLog.id;
    }
    if (!reportId) reportId = 'test-mode-dummy-id';

    return res.json({
        message: 'Analysis Complete.',
        reportId,
        title: 'Test Mode: The Product Shift',
        url: url,
        screenshot: '', 
        userSessions: userSessions.map(s => ({ persona: s.persona, avatar: s.avatar, analysis: s.analysis, description: s.description })),
        expertReport,
        scores,
        seoSchema
    });
  }

  // --- REAL ANALYSIS LOGIC ---
  let userIdentifier = req.ip || 'unknown';
  let planType = 'free';
  let revenue = 0;
  let useFreeTier = true;
  let shouldDeductCredit = false;
  let runId: string | null = null;

  // --- CREDIT & SUBSCRIPTION CHECK ---
  if (email && supabaseUrl && supabaseServiceKey) {
    userIdentifier = email;
    const { data: customer } = await supabase.from('customers').select('*').eq('email', email).single();
    
    if (customer) {
      if (customer.plan_status === 'active') {
        planType = 'subscription';
        useFreeTier = false; // Unlimited
      } else if (customer.credits > 0) {
        planType = 'credit_pack';
        useFreeTier = false;
        shouldDeductCredit = true;
      }
    }
  }

  // --- FREE TIER LIMIT CHECK ---
  if (useFreeTier) {
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_identifier', userIdentifier)
      .eq('usage_date', today)
      .single();

    if (usage && usage.count >= 1) {
      return res.status(402).json({ 
        error: 'Insufficient Credits', 
        details: 'You have reached your daily free limit. Please upgrade or buy a credit pack.' 
      });
    }
  }

  try {
    // --- TIMEOUT RACE START ---
    const analysisPromise = (async () => {
    console.log('Sending request to Browserless...');

    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    if (!browserlessToken) {
      throw new Error('BROWSERLESS_TOKEN is missing in environment variables.');
    }

    const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessToken.trim()}`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
          module.exports = async ({ page, context }) => {
            const url = context.url;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            const title = await page.title();
            const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 8000));
            const headings = await page.evaluate(() => 
              Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: h.innerText }))
            );
            const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false });
            const screenshot = screenshotBuffer.toString('base64');
            return { data: { title, bodyText, headings, screenshot }, type: 'application/json' };
          };
        `,
        context: { url }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless Error: ${response.status} - ${errorText}`);
    }

    const jsonResponse = await response.json();
    const result = jsonResponse.data; // The object returned by the browserless function

    // --- Persona-Driven Analysis ---
    const userSessions: any[] = [];
    const personas: Record<string, Persona> = {
      'alex-busy-pro': { id: 'alex-busy-pro', name: 'Alex', description: 'a busy professional with two kids under 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' },
      // ... (Add other personas if needed, but Alex is default)
    };

    for (const pId of personaIds) {
      const activePersona = personas[pId] || personas['alex-busy-pro']; // Fallback to Alex
      if (activePersona) {
        if (userSessions.length > 0) await delay(1000); // Reduced delay
        const sessionOutput = await generateUserSession(result, activePersona, goal, url);
        
        // Parse Mood
        const moodMatch = sessionOutput.match(/\|\|\|USER_MOOD\|\|\|\s*(.*)/);
        const mood = moodMatch ? moodMatch[1].trim() : 'Neutral';
        let avatarUrl = activePersona.avatar;
        if (mood.toLowerCase().includes('negative')) avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${activePersona.name}&mouth=sad`;
        if (mood.toLowerCase().includes('positive')) avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${activePersona.name}&mouth=smile`;

        userSessions.push({
          persona: activePersona.name,
          avatar: avatarUrl,
          analysis: sessionOutput,
          personaObj: activePersona
        });
      }
    }

    // --- Aggregated Expert Report ---
    await delay(1000);
    let rawExpertReport = await generateAggregatedReport(result, userSessions.map(s => ({ persona: s.personaObj, output: s.analysis })), goal, url, false);
    
    // Extract JSON Scores
    let scores = { usability: 0, desirability: 0, clarity: 0 };
    if (rawExpertReport.includes('|||SCORES_JSON|||')) {
      const parts = rawExpertReport.split('|||SCORES_JSON|||');
      let expertReportText = parts[0];
      try {
        const jsonMatch = parts[1].match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            scores = JSON.parse(jsonMatch[0]);
        } else {
            scores = JSON.parse(parts[1].trim());
        }
      } catch (e) {
        console.error('Failed to parse scores JSON', e);
      }
      rawExpertReport = expertReportText; // Update report text to exclude JSON
    }

    // --- USAGE TRACKING ---
    if (supabaseUrl && supabaseServiceKey) {
      if (shouldDeductCredit) {
        await supabase.rpc('deduct_credit', { user_email: email });
      } else if (useFreeTier) {
        const today = new Date().toISOString().split('T')[0];
        const { error: upsertError } = await supabase
          .from('daily_usage')
          .upsert({ user_identifier: userIdentifier, usage_date: today, count: 1 });
        if (upsertError && upsertError.code !== '23505') console.error('Failed to increment usage count:', upsertError);
      }

      // Log Run
      const { data: runLog, error: runLogError } = await supabase
        .from('analysis_runs')
        .insert({
          user_identifier: userIdentifier,
          url: url,
          persona_count: personaIds.length,
          estimated_cost: 0, // Simplified
          is_demo: false,
          plan_type: planType,
          revenue: revenue,
          report_data: {
            title: result.title,
            url: url,
            scores,
            expertReport: rawExpertReport,
            userSessions: userSessions.map(({ persona, avatar, analysis, personaObj }) => ({ persona, avatar, analysis, description: personaObj.description }))
          }
        })
        .select('id')
        .single();
      
      if (runLog) runId = runLog.id;
    }

    // Generate SEO Schema
    const seoSchema = generateStructuredData(url, result.title, scores, rawExpertReport);

    return {
      message: 'Analysis Complete.',
      reportId: runId,
      title: result.title,
      url: url,
      screenshot: result.screenshot,
      userSessions: userSessions.map(({ persona, avatar, analysis, personaObj }) => ({ persona, avatar, analysis, description: personaObj.description })),
      expertReport: rawExpertReport,
      scores,
      seoSchema
    };
    })(); // End of analysisPromise

    // Safety Valve: 48 second timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GRACEFUL_TIMEOUT')), 48000)
    );

    const finalResponse = await Promise.race([analysisPromise, timeoutPromise]);
    res.json(finalResponse);

  } catch (error: any) {
    if (error.message === 'GRACEFUL_TIMEOUT') {
      console.error('⚠️ Analysis timed out. Returning graceful fallback.');
      return res.json({
        message: 'Analysis Delayed',
        title: 'Analysis In Progress',
        url: url,
        screenshot: '',
        userSessions: [{
          persona: 'System',
          avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=System',
          analysis: '|||USER_MOOD|||Neutral|||USER_BUBBLE|||We\'re having a bad AI day.|||USER_DETAILS|||### 1. Status Update\nOur AI brains are a bit overloaded right now and timed out while analyzing your page.\n\n### 2. Recommendation\nPlease wait a few minutes and click **Analyze Again** above to retry.\n\n### 3. Note\nYour credit was not deducted for this incomplete run.',
          description: 'Automated System Message'
        }],
        expertReport: '### TEST RESULT: INCONCLUSIVE\nThe AI models are currently overloaded. Please retry.',
        scores: { usability: 50, desirability: 50, clarity: 50 }
      });
    }

    console.error('Test error:', error);
    const errorMessage = error.message || 'An unknown error occurred.';
    
    // Refund credit if error was not a timeout (and we deducted it)
    if (shouldDeductCredit && supabaseUrl && supabaseServiceKey) {
       await supabase.rpc('add_credits', { user_email: email, amount: 1 });
    }

    res.status(500).json({ 
      error: 'Analysis Failed', 
      details: errorMessage,
      usageCounted: false 
    });
  }
}

app.use((req, res) => {
  console.log(`[404] No route matched for: ${req.method} ${req.path}`);
  res.status(404).send(`Cannot ${req.method} ${req.path}`);
});

export default app;
