import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

// --- AI Helpers ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Stripe Initialization ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const generateContentWithFallback = async (prompt: string, screenshot?: string): Promise<string> => {
  // Strategy: Cycle through a prioritized list of models to find one with available free quota.
  const modelsToTry = [
    'gemini-1.5-flash-latest', // Highest priority: Stable, generous free tier.
    'gemini-flash-latest',     // Alias for 1.5 Flash
    'gemini-2.0-flash',        // Next best option
    'gemini-2.5-flash',        // Newest flash model
    'gemini-2.0-flash-lite',   // Lite models as final fallbacks
    'gemini-2.5-flash-lite',
    'gemini-flash-lite-latest',
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

  let lastError: any = null;

  // Helper to delay execution to avoid rate limits
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const modelName of modelsToTry) {
    // Add a "politeness" delay before every attempt to stay under RPM limits
    await delay(2000); 
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const response = result.response;
      return response.text();
    } catch (error: any) {
      console.log(`Model '${modelName}' failed: ${error.message}`);
      lastError = error;
    }
  }

  // If we exit the loop, all models failed. Throw error to be caught by handler.
  throw new Error(`All fallback models failed. Last Error: ${lastError?.message}`);
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

    Adopt the persona of ${persona.name}. You are currently looking at the webpage (screenshot and text).
    Narrate your experience out loud. Be critical, impatient, and honest.
    
    **Required Output Format:**
    |||USER_MOOD|||
    (One word: Positive, Neutral, or Negative)
    |||USER_BUBBLE|||
    (A single, genuine, emotional sentence summarizing your immediate feeling. E.g., "I'm so confused, I don't know where to click!" or "This looks super professional, I trust it.")
    |||USER_DETAILS|||
    ### 1. My Experience
    (2-3 sentences on your immediate reaction. Do you feel confident? Confused? Does the site look trustworthy?)
    
    ### 2. Points of Friction
    (Specific things that confused or annoyed you. Be nitpicky.)
    
    ### 3. What I Think This Is
    (Define the product based ONLY on what you see. Explain why.)

  `;
  return generateContentWithFallback(prompt, data.screenshot);
};

const generateAggregatedReport = async (data: ScrapedData, sessions: { persona: Persona, output: string }[], goal: string, url: string, isDemo: boolean): Promise<string> => {
  let footerContent = `
    ---
    **The Product Shift** | AI-Powered UX Audits
    Get your own report at product-shift-site.vercel.app/landingpg-aiuxagent
  `;

  if (isDemo) {
    footerContent = `
    ---
    **Ready for more?** Unlock the full potential of AI-powered UX research.
    Use code **EARLYBIRD30** for 30% off your first month of Pro.
    Upgrade Now at product-shift-site.vercel.app/landingpg-aiuxagent
    `;
  }
  const prompt = `
    You are a Senior UX Researcher. You have just observed usability tests with ${sessions.length} different users. Your report should be professional, insightful, and easy to understand.
    
    **Required Output Format:**
    ### TEST RESULT: [PASS / FAIL]
    (Brief explanation of the result).

    ### Visual & Heuristic Analysis
    (Comment on visual hierarchy, layout, and trust signals. Assign a status like [Positive], [Neutral], or [Negative] to key areas.)
    
    ### Actionable Recommendations
    (Provide 2-3 concrete steps. Use this exact format:)
    - **ISSUE:** [Description]
    - **FIX:** [Action]

    |||SCORES_JSON|||
    { "usability": 85, "desirability": 70, "clarity": 90 }
    (Provide integer scores based on the aggregate analysis)

    **Context:**
    - **URL:** ${url}
    - [Visual Screenshot Attached]

    **User Session Transcripts:**
    ${sessions.map(s => `
    ---
    USER: ${s.persona.name} (${s.persona.description})
    FEEDBACK:
    ${s.output}
    ---
    `).join('\n')}

    **IMPORTANT:** Do not use markdown tables in your response. Use bullet points or simple text.

    **PDF FOOTER:** At the very end of the report, include the following footer exactly as written, with a separator line:
    ${footerContent}
  `;
  return generateContentWithFallback(prompt, data.screenshot);
};

// Initialize Express App
const app = express();

app.set('trust proxy', 1); // Trust Vercel proxy to get correct req.ip
// Middleware
app.use(cors({ origin: true }));

// --- Stripe Webhook Endpoint ---
// This MUST be before `app.use(express.json())` so we can get the raw body for signature verification.
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('🔔 Webhook received from IP:', req.ip);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook secret or signature missing.');
    return res.status(400).send('Webhook Error: Missing secret or signature.');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message} | Ensure STRIPE_WEBHOOK_SECRET matches the Stripe Dashboard.`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log(`💰 Processing checkout session: ${session.id}`);
      const customerEmail = session.customer_details?.email;
      const segment = session.metadata?.segment;

      if (customerEmail) {
        // 1. Idempotency Check: Has this session already been processed?
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_session_id', session.id)
          .single();

        if (existingPayment) {
          console.log(`⚠️ Session ${session.id} already processed. Skipping.`);
          break;
        }

        // Scenario A: Subscription (Tech / Starter Plan)
        if (session.mode === 'subscription') {
          const stripeCustomerId = session.customer as string;
          const stripeSubscriptionId = session.subscription as string;

          // Check if this subscription comes with initial credits (e.g. Starter Plan)
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          if (creditsToAdd > 0) {
             const { error: creditError } = await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
             if (creditError) console.error('Supabase credit add error (sub):', creditError);
             else console.log(`✅ Added ${creditsToAdd} credits for subscription ${customerEmail}`);
          }

          const { error } = await supabase.from('customers').upsert({ 
            email: customerEmail,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            plan_status: 'active',
            ...(segment ? { segment } : {}) // Stamp segment if present
          }, { onConflict: 'email' });

          if (error) console.error('Supabase subscription error:', error);
          else console.log(`✅ Activated subscription for ${customerEmail}`);
        } 
        
        // Scenario B: One-Time Payment (SMB / Credit Packs)
        else if (session.mode === 'payment') {
          const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
          
          if (creditsToAdd > 0) {
            // Use our secure RPC function to increment credits atomically
            const { error } = await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
            
            if (error) console.error('Supabase credit add error:', error);
            else console.log(`✅ Added ${creditsToAdd} credits for ${customerEmail}`);
          }

          // Ensure segment is stamped for one-time buyers (especially new ones)
          if (segment) {
            // We use update here. If the user doesn't exist, add_credits (RPC) likely handled creation,
            // or we might miss it. To be safe, we can upsert or just update.
            // Since add_credits is atomic, let's just update the segment if the user exists now.
            const { error: segError } = await supabase.from('customers').update({ segment }).eq('email', customerEmail);
            if (segError) console.error('Failed to stamp segment:', segError);
          }
        }

        // Log transaction to payments table for history
        await supabase.from('payments').insert({
          email: customerEmail,
          amount_total: session.amount_total,
          currency: session.currency,
          status: session.payment_status,
          stripe_session_id: session.id
        });
      }
      break;
    // TODO: Handle other events like `customer.subscription.deleted` to downgrade users.
  }

  res.json({received: true});
});

// This must come AFTER the webhook endpoint.
app.use(express.json());

// --- Active Payment Verification (Self-Healing) ---
// Allows the frontend to force a check if the webhook is slow or missing.
app.post('/api/verify-payment', async (req, res) => {
  const { session_id } = req.body;
  
  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    // 1. Ask Stripe directly about this session
    const session = await stripe.checkout.sessions.retrieve(session_id as string);
    
    // 2. If paid, ensure the database is updated immediately
    if (session.payment_status === 'paid') {
      const customerEmail = session.customer_details?.email;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (customerEmail) {
        // 1. Idempotency Check: Check if DB is already updated
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_session_id', session.id)
          .single();

        // 2. If NOT in DB, process it now (Self-Healing)
        if (!existingPayment) {
          console.log(`🩹 Self-healing payment for session: ${session.id}`);
          
          if (session.mode === 'subscription') {
            await supabase.from('customers').upsert({ 
              email: customerEmail,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              plan_status: 'active'
            }, { onConflict: 'email' });
            
            // Also add credits for subscription if needed (Self-healing)
            const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
            if (creditsToAdd > 0) {
              await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
            }
          } else if (session.mode === 'payment') {
            const creditsToAdd = parseInt(session.metadata?.credits || '0', 10);
            if (creditsToAdd > 0) {
              await supabase.rpc('add_credits', { user_email: customerEmail, amount: creditsToAdd });
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
        
        return res.json({ 
          status: 'paid', 
          verified: true, 
          mode: session.mode,
          credits: session.metadata?.credits 
        });
      }
    }
    
    res.json({ status: session.payment_status, verified: false });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    // Don't fail hard, just return error so frontend keeps polling
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.get('/api', (req, res) => {
  res.send('AI UX Agent Backend is running!');
});

// --- Deterministic Test Routes ---
// These routes are for internal testing to provide reliable, predictable responses.
app.get('/api/test-pages/timeout', (req, res) => {
  setTimeout(() => {
    res.send('This page loaded after a long delay.');
  }, 20000); // 20 second delay, will be caught by our 15s timeout
});
app.get('/api/test-pages/access-denied', (req, res) => {
  res.status(403).send('Access Denied by Test Page');
});
app.get('/api/test-pages/server-error', (req, res) => {
  res.status(500).send('Internal Server Error on Test Page');
});

app.get('/api/test-pages/db-log', async (req, res) => {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Supabase credentials missing in environment variables' });
  }
  try {
    const { data, error } = await supabase.from('error_logs').insert({
      error_message: 'Test Log Entry from /api/test-pages/db-log',
      details: 'Testing DB write capability. If you see this, writing works.',
    }).select();

    if (error) return res.status(500).json({ error: 'Supabase Insert Failed', details: error });
    res.json({ message: 'Successfully wrote to error_logs table.', insertedData: data });
  } catch (e: any) {
    res.status(500).json({ error: 'Unexpected Error during DB Write', details: e.message });
  }
});
// --- End Test Routes ---

// --- User Data Routes ---
app.get('/api/user/transactions', async (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false });
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Referral Routes ---
app.post('/api/user/generate-referral', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Check if code exists
  const { data: existing } = await supabase.from('customers').select('referral_code').eq('email', email).maybeSingle();
  if (existing?.referral_code) return res.json({ referralCode: existing.referral_code });

  // Generate new code (Simple 6-char alphanumeric)
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Upsert: Create the customer row if it doesn't exist, or update if it does.
  const { error } = await supabase
    .from('customers')
    .upsert({ email, referral_code: code }, { onConflict: 'email' })
    .select();

  if (error) {
    // If collision (rare), just try again on next call or handle gracefully
    return res.status(500).json({ error: 'Failed to generate code' });
  }

  res.json({ referralCode: code });
});

// --- Check Referral Eligibility Endpoint ---
app.post('/api/user/check-referral-eligibility', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server config error' });

  // Security: Add random delay to prevent rapid email enumeration/scraping
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  try {
    // Check if user exists in customers table (broadest check for "has account")
    const { data: customer } = await supabase
      .from('customers')
      .select('id, credits, plan_status')
      .eq('email', email)
      .maybeSingle();

    if (customer) {
      // Only block if they actually have credits or an active plan
      if ((customer.credits || 0) > 0 || customer.plan_status === 'active') {
        return res.json({ eligible: false, reason: 'existing_user' });
      }
    }

    // Check if user has already claimed a referral (Lifetime limit: 1)
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_email', email)
      .maybeSingle();

    if (existingRef) {
      return res.json({ eligible: false, reason: 'already_claimed' });
    }

    // Also check payments just in case
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('email', email)
      .limit(1);
      
    if (payment && payment.length > 0) {
        return res.json({ eligible: false, reason: 'existing_customer' });
    }

    return res.json({ eligible: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// --- Claim Referral Endpoint ---
app.post('/api/user/claim-referral', async (req, res) => {
  const { email, referralCode } = req.body;
  if (!email || !referralCode) return res.status(400).json({ error: 'Missing requirements' });

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server config error' });

  try {
    // 1. Check if this referral has already been processed
    // We check if this email has EVER been a referee (limit 1 lifetime claim)
    const { data: existingRef } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_email', email)
      .single();

    if (existingRef) return res.status(400).json({ error: 'User has already claimed a referral.' });

    // 2. Check if user is actually new (Has never paid)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (existingPayment && existingPayment.length > 0) {
      return res.status(400).json({ error: 'Existing customers are not eligible for new user referrals.' });
    }

    // 3. Smart New User Check: Allow existing rows ONLY if they are empty (0 credits, no plan)
    // This handles cases where Auth triggers create the row before we get here.
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, credits, plan_status')
      .eq('email', email)
      .maybeSingle();

    if (existingCustomer) {
      if ((existingCustomer.credits || 0) > 0 || existingCustomer.plan_status === 'active') {
        return res.status(400).json({ error: 'Existing accounts with activity are not eligible for new user referrals.' });
      }
    }

    // 4. Ensure Customer Row Exists & Has Valid Credits
    // If the user exists but has NULL credits (common with Auth triggers), initialize to 0.
    if (existingCustomer) {
      if (existingCustomer.credits === null) {
        await supabase.from('customers').update({ credits: 0 }).eq('email', email);
      }
    } else {
      await supabase.from('customers').insert({ email, credits: 0 });
    }

    const { data: referrer } = await supabase.from('customers').select('email').eq('referral_code', referralCode).single();
    
    if (referrer && referrer.email !== email) { // Prevent self-referral
      // 5. Log as PENDING & Grant Credit ONLY to Referee
      // Referrer gets nothing yet.
      const { error: insertError } = await supabase.from('referrals').insert({ 
        referrer_code: referralCode, 
        referee_email: email,
        status: 'pending' 
      });
      
      if (!insertError) {
        await supabase.rpc('add_credits', { user_email: email, amount: 1 });
        return res.json({ success: true, message: 'Referral claimed. Run a test to unlock the reward for your friend!' });
      }
    }
    return res.status(400).json({ error: 'Invalid referral' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    browserlessToken: process.env.BROWSERLESS_TOKEN ? 'SET' : 'MISSING',
    geminiApiKey: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
    supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING',
  });
});

const personas: Record<string, Persona> = {
  'alex-busy-pro': {
    id: 'alex-busy-pro',
    name: 'Alex',
    description: 'a busy professional with two kids under 5',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra',
  },
  'sam-college-student': {
    id: 'sam-college-student',
    name: 'Sam',
    description: 'a budget-conscious college student',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam',
  },
  'charlie-family-worker': {
    id: 'charlie-family-worker',
    name: 'Charlie',
    description: 'a masculine, patriotic blue-collar worker',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie',
  },
  'beth-homemaker': {
    id: 'beth-homemaker',
    name: 'Beth',
    description: 'a 45+ family-oriented homemaker with poor eyesight',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth',
  },
  'sarah-social-shopper': {
    id: 'sarah-social-shopper',
    name: 'Sarah',
    description: 'a social influencer and avid shopper',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah',
  },
  'elizabeth-wealthy-elite': {
    id: 'elizabeth-wealthy-elite',
    name: 'Elizabeth',
    description: 'a highly educated and wealthy individual with deep connections',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine',
  },
  'marcus-c-suite': {
    id: 'marcus-c-suite',
    name: 'Marcus',
    description: 'a C-level executive of a Fortune 500 company',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus',
  },
  'linda-business-owner': {
    id: 'linda-business-owner',
    name: 'Linda',
    description: 'a business owner with 10 employees',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda',
  },
};

const runTestHandler = async (req: express.Request, res: express.Response) => {
  const { url, personaIds, goal, email } = req.body;
  const isDemo = personaIds.length === 1;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
    return res.status(400).json({ error: 'At least one persona is required' });
  }

  if (!goal) {
    return res.status(400).json({ error: 'A goal is required' });
  }

  if (!process.env.BROWSERLESS_TOKEN) {
    console.error('BROWSERLESS_TOKEN is not set.');
    return res.status(500).json({ error: 'Server Configuration Error', details: 'The Browserless API token is not configured.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set.');
    return res.status(500).json({ error: 'Server Configuration Error', details: 'The AI API key is not configured.' });
  }

  // --- SECURITY: SSRF Protection ---
  try {
    const hostname = new URL(url).hostname;
    // Check for localhost
    if (hostname === 'localhost') throw new Error('Localhost');
    
    // Only apply IP-based blocking if the hostname looks like an IP
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || /^\[?[a-fA-F0-9:]+\]?$/.test(hostname);
    if (isIp) {
      const isRestrictedIp = /^(?:127\.|192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.|\[::1\]|\[f[c-d][0-9a-f]{2}:)/i.test(hostname);
      if (isRestrictedIp) throw new Error('Private IP');
    }
  } catch (e: any) {
    if (e.message === 'Localhost' || e.message === 'Private IP') {
       return res.status(400).json({
          error: 'Restricted URL',
          details: 'For security reasons, analysis of local or private network addresses is not permitted.',
          usageCounted: false
       });
    }
    return res.status(400).json({ error: 'Invalid URL', details: 'The provided URL is not valid.' });
  }

  // --- Usage Limit Check ---
  const userIdentifier = req.ip; // Use IP address for simple unique user tracking
  const today = new Date().toISOString().split('T')[0];
  const GLOBAL_DAILY_LIMIT = 25; // Set a conservative global limit of 25 free tests per day

  let useFreeTier = true;
  let shouldDeductCredit = false;

  // --- CREDIT & SUBSCRIPTION CHECK ---
  // If user is logged in, check if they have a plan or credits
  if (email && supabaseUrl && supabaseServiceKey) {
    const { data: customer } = await supabase
        .from('customers')
        .select('plan_status, credits')
        .eq('email', email)
        .single();
    
    if (customer) {
        const hasCredits = (customer.credits || 0) > 0;
        const isSubscriber = customer.plan_status === 'active';

        if (isSubscriber || hasCredits) {
            useFreeTier = false; // They are a paying user, not on the free tier.
            if (hasCredits) {
                shouldDeductCredit = true; // They have credits to spend.
            } else {
                // This is a subscriber with 0 credits. Block them.
                return res.status(402).json({ 
                    error: 'Insufficient Credits', 
                    details: 'You have used all your available tests for this month. Please wait for your plan to renew or purchase a top-up pack.' 
                });
            }
        } else if ((customer.credits || 0) > 0) { // This is now redundant but kept for safety, the logic above handles it.
            useFreeTier = false; // Credit Holder: Bypass limits
            shouldDeductCredit = true;
        } else {
            // Not a subscriber and no credits.
            return res.status(402).json({ 
                error: 'Insufficient Credits', 
                details: 'You have no available tests. Please purchase a pack or subscribe to continue.' 
            });
        }
    }
  }

  // --- BYPASS LOGIC ---
  // 1. Automatically bypass limits on Preview branches or Local Development
  const isNonProduction = process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development' || process.env.NODE_ENV === 'development';
  // 2. Allow manual bypass via Environment Variable (The "Switch")
  const isManualBypass = process.env.SKIP_USAGE_LIMITS === 'true';

  // Only check free limits if they aren't a subscriber/credit-holder AND we aren't manually bypassing
  const shouldCheckLimits = useFreeTier && !isNonProduction && !isManualBypass;

  // Only run usage checks if Supabase is configured AND we aren't bypassing limits
  if (shouldCheckLimits && supabaseUrl && supabaseServiceKey) {
    try {
      // Check global daily usage
      const { count: globalCount, error: globalError } = await supabase
        .from('daily_usage')
        .select('*', { count: 'exact', head: true })
        .eq('usage_date', today);

      if (globalError) throw globalError;
      if (globalCount !== null && globalCount >= GLOBAL_DAILY_LIMIT) {
        return res.status(429).json({ error: 'Daily Limit Reached', details: 'The global daily limit for free demos has been reached. Please try again tomorrow.' });
      }

      // Check this specific user's daily usage
      const { data: userData, error: userError } = await supabase
        .from('daily_usage')
        .select('count')
        .eq('user_identifier', userIdentifier)
        .eq('usage_date', today)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError; // Ignore "no rows found" error
      if (userData && userData.count >= 1) {
        return res.status(429).json({ error: 'Demo Limit Reached', details: 'You have already run your free demo for today. Please upgrade to Pro for unlimited tests.' });
      }
    } catch (e: any) {
      if (e.code === '42P01') { // Specific PostgreSQL error code for "undefined_table"
         return res.status(500).json({ error: 'Database Setup Incomplete', details: `The required 'daily_usage' table was not found. Please ensure the database setup script has been run.` });
      }
      return res.status(500).json({ error: 'Database Error', details: `Could not verify usage limits: ${e.message}` });
    }
  }

  // --- TEST MODE LOGIC (Moved after credit checks) ---
  if (url.toLowerCase().includes('test-mode')) {
    console.log('--- RUNNING IN TEST MODE ---');

    // DEDUCT CREDIT IF APPLICABLE (Even for test mode, to verify flow)
    if (shouldDeductCredit && email && supabaseUrl && supabaseServiceKey) {
        const { data: current } = await supabase.from('customers').select('credits').eq('email', email).single();
        if (current && current.credits > 0) {
            await supabase.from('customers').update({ credits: current.credits - 1 }).eq('email', email);
            console.log(`💳 Test Mode: Deducted 1 credit from ${email}`);
        }
    }

    // --- REFERRAL COMPLETION CHECK (Test Mode) ---
    if (email && supabaseUrl && supabaseServiceKey) {
        const { data: pendingReferral } = await supabase
          .from('referrals')
          .select('id, referrer_code')
          .eq('referee_email', email)
          .eq('status', 'pending')
          .single();

        if (pendingReferral) {
          await supabase.from('referrals').update({ status: 'completed' }).eq('id', pendingReferral.id);
          const { data: referrer } = await supabase.from('customers').select('email').eq('referral_code', pendingReferral.referrer_code).single();
          if (referrer) await supabase.rpc('add_credits', { user_email: referrer.email, amount: 1 });
        }
    }

    // --- SIMULATED ERROR SCENARIOS ---
    if (url.includes('test-mode-ssl')) {
      const sslErrorDetails = `Security Alert: Insecure Connection Detected. Our AI agent detected a security issue with your site's SSL/TLS certificate (net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH).`;
      return res.status(400).json({
        error: 'Site Security Error',
        details: sslErrorDetails,
        usageCounted: false
      });
    }
    // ... (Keep other error scenarios if needed, omitted for brevity) ...

    const fakeReport = {
        message: 'Analysis Complete.',
        title: 'Test Mode: The Product Shift',
        screenshot: '', 
        userSessions: [
            {
                persona: 'Alex',
                avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra',
                analysis: '|||USER_MOOD|||Positive|||USER_BUBBLE|||I instantly get what this is. The value prop is super clear.|||USER_DETAILS|||### 1. My Experience\nI landed on the page and immediately understood the offering. The headline "AI-Powered UX Audits" is punchy. I feel confident this tool could save me time.\n\n### 2. Points of Friction\nI\'m not sure about the pricing structure. It says "Pro" but doesn\'t list a price upfront. That\'s a bit annoying.\n\n### 3. What I Think This Is\nIt\'s an automated user testing tool that uses AI agents instead of real people to give quick feedback.',
                description: 'a busy professional with two kids under 5',
                personaObj: { id: 'alex-busy-pro', name: 'Alex', description: 'a busy professional with two kids under 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' }
            },
            {
                persona: 'Marcus',
                avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus',
                analysis: '|||USER_MOOD|||Neutral|||USER_BUBBLE|||I need to see the bottom-line impact immediately.|||USER_DETAILS|||### 1. My Experience\nProfessional design, but I\'m looking for the ROI case. Does this integrate with our existing stack? I need to know this is enterprise-ready.\n\n### 2. Points of Friction\nToo much focus on features, not enough on business outcomes. Pricing needs to be transparent for enterprise procurement.\n\n### 3. What I Think This Is\nA tool for optimizing conversion rates and reducing R&D overhead.',
                description: 'a C-level executive of a Fortune 500 company',
                personaObj: { id: 'marcus-c-suite', name: 'Marcus', description: 'a C-level executive of a Fortune 500 company', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' }
            },
            {
                persona: 'Linda',
                avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda',
                analysis: '|||USER_MOOD|||Positive|||USER_BUBBLE|||This could save my team hours of manual testing.|||USER_DETAILS|||### 1. My Experience\nI like the promise of automation. My team is small, so we don\'t have a dedicated UX researcher. This looks like it bridges that gap.\n\n### 2. Points of Friction\nIs it easy to onboard? I don\'t have time for a steep learning curve. I need to see a "How it works" video.\n\n### 3. What I Think This Is\nAn automated testing assistant for SMBs.',
                description: 'a business owner with 10 employees',
                personaObj: { id: 'linda-business-owner', name: 'Linda', description: 'a business owner with 10 employees', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda' }
            }
        ],
        expertReport: '### TEST RESULT: PASS\nThe site demonstrates strong clarity and desirability. The value proposition is communicated effectively above the fold.\n\n### Visual & Heuristic Analysis\n- **Visual Hierarchy:** [Positive] The primary headline and CTA are distinct and draw attention immediately.\n- **Trust Signals:** [Neutral] While the design is professional, adding social proof or testimonials would boost credibility.\n- **Navigation:** [Positive] Simple and intuitive.\n\n### Actionable Recommendations\n- **ISSUE:** Pricing transparency is lacking for the Pro tier.\n- **FIX:** Add a "starting at" price or a comparison table to the pricing section.\n- **ISSUE:** The "Join Waitlist" CTA is repetitive.\n- **FIX:** Vary the CTA text (e.g., "Get Early Access", "Secure Your Spot") to reduce fatigue.\n\n|||SCORES_JSON|||\n{ "usability": 88, "desirability": 92, "clarity": 95 }',
        scores: { usability: 88, desirability: 92, clarity: 95 }
    };
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.json(fakeReport);
  }

  try {
    console.log('Sending request to Browserless...');

    // This script runs on the Browserless.io servers.
    const browserScript = `
      export default async ({ page, context }) => {
        const { url } = context;
        await page.setViewport({ width: 1280, height: 800 }); // Corrected viewport setting
        // Set timeout to 15s to ensure we return before Vercel's hard limit
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        // SPA Stabilization: Wait for client-side redirects/hydration to settle.
        // This prevents "Execution context destroyed" if the app redirects immediately after load.
        await new Promise(r => setTimeout(r, 2000));
        
        // Check HTTP Status Codes to trigger specific errors
        if (response) {
          const status = response.status();
          if (status === 403 || status === 401) {
            throw new Error('BROWSERLESS_ERR_ACCESS_DENIED_STATUS');
          }
          if (status === 404) {
            throw new Error('BROWSERLESS_ERR_NOT_FOUND_STATUS');
          }
          if (status >= 500) {
            throw new Error('BROWSERLESS_ERR_SERVER_ERROR');
          }
        }

        const title = await page.title();

        const headings = await page.evaluate(() => {
          const headingElements = Array.from(document.querySelectorAll('h1, h2, h3'));
          return headingElements.map(h => ({
            tag: h.tagName,
            text: h.textContent?.trim() || ''
          }));
        });

        const bodyText = await page.evaluate(() => {
          const mainEl = document.querySelector('main');
          const contentEl = mainEl || document.body;
          return contentEl.innerText.trim().substring(0, 1500); // Get first 1500 chars
        });

        // Take a screenshot of the viewport (JPEG is smaller/faster for AI analysis)
        const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 });

        // A valid connection will have a protocol. An invalid one might be null.
        // Defensively check if the response object and its properties exist.
        const securityDetails = response ? response.securityDetails() : null;
        const hasValidSsl = !!(securityDetails && securityDetails.protocol()?.startsWith('TLS'));
        return { title, headings, bodyText, screenshot, hasValidSsl };
      };
    `;

    // Reverted to a simple fetch call. We will not try to bypass SSL errors anymore.
    try {
      const response = await fetch(`https://production-sfo.browserless.io/function?token=${process.env.BROWSERLESS_TOKEN!}`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: browserScript,
        context: { url },
      })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Browserless Error Raw:', errorText);
        
        // --- Corrected Network Error Mapping ---

        // 1. Check for our custom, specific errors thrown from the browser script first.
        if (errorText.includes('BROWSERLESS_ERR_ACCESS_DENIED_STATUS')) {
            throw new Error('BROWSERLESS_ERR_ACCESS_DENIED');
        }
        if (errorText.includes('BROWSERLESS_ERR_SERVER_ERROR')) {
            throw new Error('BROWSERLESS_ERR_SERVER_ERROR');
        }
        if (errorText.includes('BROWSERLESS_ERR_NOT_FOUND_STATUS')) {
            throw new Error('BROWSERLESS_ERR_NOT_FOUND');
        }
        if (errorText.includes('Execution context was destroyed')) {
            throw new Error('BROWSERLESS_ERR_CONTEXT_DESTROYED');
        }

        // 2. Check for specific, known network-level errors.
        if (errorText.includes('net::ERR_SSL_') || errorText.includes('net::ERR_CERT_')) {
          throw new Error('BROWSERLESS_ERR_SSL');
        }
        if (errorText.includes('net::ERR_NAME_NOT_RESOLVED')) {
          throw new Error('BROWSERLESS_ERR_NOT_FOUND');
        }
        // A refused connection or an empty response from a firewall is a form of access denial.
        if (errorText.includes('net::ERR_CONNECTION_REFUSED') || errorText.includes('net::ERR_EMPTY_RESPONSE')) {
          throw new Error('BROWSERLESS_ERR_ACCESS_DENIED');
        }

        // 3. Check for genuine timeout errors from Browserless as a fallback.
        if (errorText.includes('net::ERR_CONNECTION_TIMED_OUT') || errorText.includes('TimeoutError') || errorText.includes('Navigation timeout')) {
          throw new Error('BROWSERLESS_ERR_TIMEOUT');
        }

        // Fallback for other Browserless errors
        throw new Error(`Browserless error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();

      // --- Persona-Driven Analysis ---
      const userSessions: any[] = [];

      // Helper to delay execution to avoid rate limits (Free Tier Throttling)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const pId of personaIds) {
        const activePersona = personas[pId];
        if (activePersona) {
          // Add a 6-second delay before each request (except the first) to stay under the RPM limit
          if (userSessions.length > 0) {
              await delay(6000);
          }

          const sessionOutput = await generateUserSession(result, activePersona, goal, url);
          
          // Parse Mood to adjust avatar
          let mood = 'Neutral';
          let adjustedAvatar = activePersona.avatar;
          
          if (sessionOutput.includes('|||USER_MOOD|||')) {
            const moodPart = sessionOutput.split('|||USER_MOOD|||')[1].split('|||')[0].trim();
            if (moodPart.toLowerCase().includes('positive')) {
              mood = 'Positive';
              adjustedAvatar = activePersona.avatar.replace(/mouth=[^&]+/, 'mouth=smile').replace(/eyebrows=[^&]+/, 'eyebrows=default');
            } else if (moodPart.toLowerCase().includes('negative')) {
              mood = 'Negative';
              adjustedAvatar = activePersona.avatar.replace(/mouth=[^&]+/, 'mouth=sad').replace(/eyebrows=[^&]+/, 'eyebrows=frown');
            } else {
              adjustedAvatar = activePersona.avatar.replace(/mouth=[^&]+/, 'mouth=default').replace(/eyebrows=[^&]+/, 'eyebrows=default');
            }
          }

          userSessions.push({
            persona: activePersona.name,
            avatar: adjustedAvatar,
            analysis: sessionOutput,
            personaObj: activePersona // Keep ref for report generation
          });
        }
      }

      // --- On success, increment usage count ---
      if (supabaseUrl && supabaseServiceKey) {
        const { error: upsertError } = await supabase
          .from('daily_usage')
          .upsert({ user_identifier: userIdentifier, usage_date: today, count: 1 });

        if (upsertError) {
          // Log the error but don't fail the request for the user
          console.error('Failed to increment usage count:', upsertError);
        }
      }

      // --- DEDUCT CREDIT (If applicable) ---
      if (shouldDeductCredit && email && supabaseUrl && supabaseServiceKey) {
        const { data: current } = await supabase.from('customers').select('credits').eq('email', email).single();
        if (current && current.credits > 0) {
            const newBalance = current.credits - 1;
            await supabase.from('customers').update({ credits: newBalance }).eq('email', email);
            
            if (newBalance === 0) {
                console.log(`📧 [Email Trigger] User ${email} has run out of credits.`);
                // TODO: Call your email service here (e.g. Resend.com, SendGrid)
            }
        }
      }

      // --- REFERRAL COMPLETION CHECK ---
      // If this user was referred and just ran a test, complete the referral and reward the referrer.
      if (email && supabaseUrl && supabaseServiceKey) {
        const { data: pendingReferral } = await supabase
          .from('referrals')
          .select('id, referrer_code')
          .eq('referee_email', email)
          .eq('status', 'pending')
          .single();

        if (pendingReferral) {
          // 1. Mark as completed
          await supabase.from('referrals').update({ status: 'completed' }).eq('id', pendingReferral.id);
          // 2. Reward the Referrer
          const { data: referrer } = await supabase.from('customers').select('email').eq('referral_code', pendingReferral.referrer_code).single();
          if (referrer) {
             await supabase.rpc('add_credits', { user_email: referrer.email, amount: 1 });
             console.log(`🎁 Referral Completed: ${referrer.email} rewarded for ${email}'s first test.`);
          }
        }
      }

      // --- MVP Plan & Revenue Logging ---
      const isStarterPlan = url.includes('plan=starter');
      const planType = isStarterPlan ? 'starter' : (isDemo ? 'demo' : 'free');
      const revenue = isStarterPlan ? 29.00 : 0;

      // --- Log Analysis Run & Cost ---
      if (supabaseUrl && supabaseServiceKey) {
        // Default to 2 cents per AI call if not specified in environment
        const costPerAiCallCents = parseInt(process.env.AI_COST_PER_CALL_CENTS || '2');
        const totalAiCalls = personaIds.length + 1; // N personas + 1 aggregated report
        const estimatedCost = (totalAiCalls * costPerAiCallCents) / 100; // Store cost in dollars

        const { error: runLogError } = await supabase
          .from('analysis_runs')
          .insert({
            user_identifier: userIdentifier,
            url: url,
            persona_count: personaIds.length,
            estimated_cost: estimatedCost,
            is_demo: isDemo,
            plan_type: planType,
            revenue: revenue
          });
        if (runLogError) console.error('Failed to log analysis run:', runLogError);
      }

      // --- Aggregated Expert Report ---
      await delay(6000); // Delay before the final expert report generation
      let rawExpertReport = await generateAggregatedReport(result, userSessions.map(s => ({ persona: s.personaObj, output: s.analysis })), goal, url, isDemo);
      
      // Extract JSON Scores
      let scores = { usability: 0, desirability: 0, clarity: 0 };
      let expertReportText = rawExpertReport;

      if (rawExpertReport.includes('|||SCORES_JSON|||')) {
        const parts = rawExpertReport.split('|||SCORES_JSON|||');
        expertReportText = parts[0];
        try {
          scores = JSON.parse(parts[1].trim());
        } catch (e) {
          console.error('Failed to parse scores JSON', e);
        }
      }

      // Prepend the security warning if an SSL issue was detected
      if (!result.hasValidSsl) {
        expertReportText = '|||SSL_WARNING_ALERT|||\n' + expertReportText;
      }

      res.json({
        message: 'Analysis Complete.',
        title: result.title,
        url: url,
        screenshot: result.screenshot,
        userSessions: userSessions.map(({ persona, avatar, analysis, personaObj }) => ({ persona, avatar, analysis, description: personaObj.description })),
        expertReport: expertReportText,
        scores
      });
    } catch (error: any) {
      throw error;
    }

  } catch (error: any) {
    console.error('Test error:', error);
    const errorMessage = error.message || 'An unknown error occurred.';
    
    // Log error to Supabase for Admin Dashboard
    if (supabaseUrl && supabaseServiceKey) {
      try {
        await supabase.from('error_logs').insert({
          error_message: `Failed to run the test: ${errorMessage}`,
          details: error.stack || JSON.stringify(error), // Log the full error for debugging
        });
      } catch (logErr) {
        console.error('Failed to log error to DB:', logErr);
      }
    }

    // Provide a specific, user-friendly error for the SSL issue.
    if (errorMessage === 'BROWSERLESS_ERR_SSL' || errorMessage.includes('net::ERR_SSL_') || errorMessage.includes('net::ERR_CERT_')) {
      const sslErrorDetails = `Security Alert: Insecure Connection Detected. Our AI agent detected a security issue with your site's SSL/TLS certificate (net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH).`;
      return res.status(400).json({
        error: 'Site Security Error',
        details: sslErrorDetails,
        usageCounted: false
      });
    }

    // Map other specific network errors to user-friendly responses
    if (errorMessage === 'BROWSERLESS_ERR_NOT_FOUND') {
      return res.status(400).json({
        error: 'Site Not Found',
        details: 'We could not locate this domain. Please check your spelling and ensure the website is online.',
        usageCounted: false
      });
    }
    if (errorMessage === 'BROWSERLESS_ERR_TIMEOUT' || errorMessage.includes('TimeoutError')) {
      return res.status(408).json({
        error: 'Connection Timed Out',
        details: 'The URL you entered took too long to respond. This can happen if the site is down, experiencing heavy traffic, or blocking automated access.',
        usageCounted: false
      });
    }
    if (errorMessage === 'BROWSERLESS_ERR_REFUSED' || errorMessage === 'BROWSERLESS_ERR_ACCESS_DENIED') {
      return res.status(403).json({
        error: 'Access Denied',
        details: 'The URL you provided is blocking our AI agent. This can happen with sites that have strict firewalls or anti-bot protection.',
        usageCounted: false
      });
    }
    if (errorMessage === 'BROWSERLESS_ERR_CONTEXT_DESTROYED') {
      return res.status(409).json({
        error: 'Page Redirected Unexpectedly',
        details: 'The page navigated or reloaded while we were analyzing it. This often happens with sites that have immediate client-side redirects.',
        usageCounted: false
      });
    }
    if (errorMessage.includes('BROWSERLESS_ERR_SERVER_ERROR')) {
      return res.status(502).json({
        error: 'Target Site Error',
        details: 'The URL you entered responded with a server error (500 or similar). The site may be down for maintenance or experiencing issues.',
        usageCounted: false
      });
    }

    res.status(500).json({ error: `Failed to run the test`, details: errorMessage });
  }
};

// --- Stripe Checkout Route ---
app.post('/api/create-checkout-session', async (req, res) => {
  const { planId, segment } = req.body;
  const userEmail = req.body.email; // We'll get this from the user later

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is missing.');
    return res.status(500).json({ error: 'Server Configuration Error: Stripe key missing' });
  }

  try {
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'subscription';
    let lineItems = [];
    let metadata: any = {};
    
    if (segment) {
      metadata.segment = segment;
    }

    // Define Products & Prices (In a real app, these would be in Stripe Dashboard)
    if (planId === 'starter') {
      mode = 'subscription';
      metadata = { ...metadata, credits: '10' }; // Starter plan gets 10 credits
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Starter Plan', description: '10 AI UX Audits per month' },
          unit_amount: 2900, // $29.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      });
    } else if (planId === 'pack-3') {
      mode = 'payment';
      metadata = { ...metadata, credits: '3' };
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: '3 Test Pack', description: '3 AI UX Audits (No Expiry)' },
          unit_amount: 1400, // $14.00
        },
        quantity: 1,
      });
    } else if (planId === 'pack-15') {
      mode = 'payment';
      metadata = { ...metadata, credits: '15' };
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: '15 Test Pack', description: '15 AI UX Audits (No Expiry)' },
          unit_amount: 6900, // $69.00
        },
        quantity: 1,
      });
    } else {
      return res.status(400).json({ error: 'Invalid Plan ID' }); 
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail, // Pass the user's email to pre-fill and link the customer
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      metadata: metadata, // Pass credits info to webhook
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/landingpg-aiuxagent`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});

app.post('/api/run-test', runTestHandler);

app.post('/api/join-waitlist', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    // In a real scenario, you might still want to capture emails even if DB is down,
    // but for now, we'll return an error.
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const { error } = await supabase.from('waitlist_emails').insert({ email });

  if (error) {
    return res.status(500).json({ error: 'Could not save email.', details: error.message });
  }

  return res.status(200).json({ message: 'Successfully joined waitlist.' });
});

app.post('/api/admin/refund', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { paymentId, reason } = req.body; // paymentId is the internal DB ID

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Get payment details from DB
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (!payment.stripe_session_id) return res.status(400).json({ error: 'No Stripe Session ID associated' });

    // 2. Get Stripe Session to find Payment Intent
    const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
    const paymentIntentId = session.payment_intent as string;

    // 3. Issue Refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
    });

    // 4. Update DB Status
    await supabase.from('payments').update({ status: 'refunded' }).eq('id', paymentId);

    res.json({ success: true, refundId: refund.id });
  } catch (error: any) {
    console.error('Refund Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/errors/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { id } = req.params;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'DB Config Missing' });
  }

  const { error } = await supabase.from('error_logs').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

app.get('/api/admin/stats', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;

  // 1. Security Check
  if (!secretKey) {
     console.error('ADMIN_SECRET_KEY is not set in environment variables.');
     return res.status(500).json({ error: 'Server Configuration Error: ADMIN_SECRET_KEY missing' });
  }

  if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Secret Key' });
  }

  try {
    // 2. Fetch Data (Mock if DB is missing, Real if DB is present)
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.json({
            dailyUsage: 0,
            waitlistCount: 0,
            recentErrors: []
        });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get Daily Usage (Sum of all counts for today)
    const { data: usageData, error: usageError } = await supabase
        .from('daily_usage')
        .select('count')
        .eq('usage_date', today);
    
    if (usageError) throw usageError;
    const dailyUsage = usageData?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    // Get Waitlist Count
    const { count: waitlistCount, error: waitlistError } = await supabase
        .from('waitlist_emails')
        .select('*', { count: 'exact', head: true });
    
    if (waitlistError) throw waitlistError;

    // Get Referral Count
    const { count: referralCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

    // Get Recent Errors
    const { data: recentErrors } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    // Get Recent Analysis Runs
    const { data: recentRuns, error: runsError } = await supabase
        .from('analysis_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (runsError) throw runsError;

    // Get Recent Subscribers
    const { data: recentSubscribers, error: subscribersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (subscribersError) throw subscribersError;

    // Get Financial Stats
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount_total, status, created_at')
      .eq('status', 'paid'); // Only count successful payments
    
    const totalRevenueCents = allPayments?.reduce((acc, curr) => acc + curr.amount_total, 0) || 0;
    
    // Breakdown by Plan (Heuristic based on price points)
    const salesBreakdown = {
      pack3: allPayments?.filter(p => p.amount_total === 1400).length || 0,
      pack15: allPayments?.filter(p => p.amount_total === 6900).length || 0,
      starter: allPayments?.filter(p => p.amount_total === 2900).length || 0,
    };

    // Get Recent Payments (for Admin Review/Refunds)
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ dailyUsage, waitlistCount: waitlistCount || 0, referralCount: referralCount || 0, recentErrors: recentErrors || [], recentRuns: recentRuns || [], recentSubscribers: recentSubscribers || [], totalRevenue: totalRevenueCents / 100, salesBreakdown, recentPayments });
  } catch (error: any) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// Export the app for Vercel
export default app;
