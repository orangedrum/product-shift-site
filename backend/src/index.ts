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
// We will initialize genAI inside the function to ensure we catch the latest env var
// Note: We are relying on the SDK's default behavior but ensuring we use stable model aliases.
// If v1beta continues to fail, we might need to manually fetch against the v1 REST API.

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
// FIX: Prevent top-level crash if env vars are missing (common in Preview environments).
// We use a placeholder so the app initializes, but DB calls will fail gracefully later.
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
  
  // Debug Log: Verify we are using the correct key (Security: Only log first 4 chars)
  console.log(`🔑 Using Gemini API Key starting with: ${apiKey.substring(0, 4)}...`);

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
      // Smart Scavenger: Only delay if we failed, to give the API a breather before the next attempt
      await delay(2000);
      console.log(`Model '${modelName}' failed: ${error.message}`);
      // Enhance error message for 404s which usually mean API is disabled or Key is restricted
      if (error.message.includes('404') && error.message.includes('not found')) {
        errorLog.push(`${modelName}: 404 (Check if Generative Language API is enabled in Google Cloud or Key is restricted)`);
        
        // DIAGNOSTIC: If we get a 404, ask the API what models ARE available.
        try {
          console.log(`🔍 Diagnostic: Listing available models for this key...`);
          const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (listResp.ok) {
            const listData = await listResp.json();
            console.log('🔍 Diagnostic Result:', JSON.stringify(listData));
          } else {
            console.log(`🔍 Diagnostic Failed: ${listResp.status} ${await listResp.text()}`);
          }
        } catch (diagErr) {
          console.error('🔍 Diagnostic Error:', diagErr);
        }
      } else if (error.message.includes('400') && (error.message.includes('API key') || error.message.includes('expired'))) {
        errorLog.push(`${modelName}: 400 API Key Invalid/Expired (Check Vercel Environment Variables)`);
      } else if (error.message.includes('429') || error.message.includes('exhausted')) {
        errorLog.push(`${modelName}: 429 Rate Limit Exceeded (Free Tier limit hit - No Charge)`);
      } else {
        errorLog.push(`${modelName}: ${error.message}`);
      }
    }
  }

  // If we exit the loop, all models failed. Throw error to be caught by handler.
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

// --- Email Helper (No Dependency) ---
const sendEmail = async (to: string, subject: string, html: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('Resend API key missing. Skipping email.');
    console.warn('Make sure RESEND_API_KEY is set in your Vercel Environment Variables.');
    return;
  }

  const fullHtml = getEmailTemplate(html);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ from: emailFrom, to, subject, html: fullHtml })
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API Error:', errText);
      // We log it, but we also want to know about it in the logs
      console.error(`❌ Failed to send email to ${to}. Status: ${response.status}`);
    } else {
      console.log(`✅ Resend Email sent successfully to: ${to}`);
    }
  } catch (e) {
    console.error('Failed to send email:', e);
    // throw e; // Don't propagate error to the caller to avoid 500s on frontend
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

    Adopt the persona of ${persona.name}. You are currently looking at the webpage (screenshot and text).
    Narrate your experience out loud. Be critical, impatient, and honest.
    
    **Required Output Format:**
    |||USER_MOOD|||
    (One word: Positive, Neutral, or Negative)
    |||USER_BUBBLE|||
    (A single, genuine, emotional sentence connecting your specific problem/pain point to the solution you see on the page. E.g., "As a busy parent, this scheduling tool is exactly the relief I need!" or "I'm drowning in data, but this dashboard just adds more noise.")
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

// --- SEO Helper: Generate Schema.org JSON-LD ---
const generateStructuredData = (url: string, title: string, scores: any, summary: string) => {
  // Strip markdown for the schema description
  const cleanSummary = summary.replace(/[#*]/g, '').split('\n').filter(line => line.trim().length > 0).slice(0, 3).join(' ');

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "WebSite",
      "name": title,
      "url": url
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": scores.usability,
      "bestRating": "100",
      "worstRating": "0"
    },
    "author": {
      "@type": "Organization",
      "name": "Product Shift AI"
    },
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
app.use(cors({ origin: true, credentials: true }));

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
      if (session.total_details?.breakdown?.discounts && session.total_details.breakdown.discounts.length > 0) {
        console.log(`🎟️ Discount Applied: ${JSON.stringify(session.total_details.breakdown.discounts)}`);
      }

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
            // CTO FIX: We add .select() to verify if a row was actually updated.
            const { data: updatedRows, error: segError } = await supabase
              .from('customers')
              .update({ segment })
              .eq('email', customerEmail)
              .select();

            // If error OR no rows were updated (user not found yet), trigger the fallback upsert.
            if (segError || !updatedRows || updatedRows.length === 0) {
              if (segError) console.error('Failed to stamp segment (Update):', segError);
              else console.log('Segment update missed (User not ready). Triggering fallback upsert.');
              
              // Fallback: Try upsert if update failed (e.g. row wasn't ready yet)
              // We only set the segment, preserving other fields if they exist (though upsert merges)
              // Note: This is a safety net.
              await supabase.from('customers').upsert({ email: customerEmail, segment }, { onConflict: 'email' });
            } else {
              console.log(`✅ Stamped segment '${segment}' for ${customerEmail}`);
            }
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

// --- Global Middleware ---
// This must come AFTER the webhook endpoint (which needs raw body)
// but BEFORE all other API routes (which need JSON).
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
      const segment = session.metadata?.segment;

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
              plan_status: 'active',
              ...(segment ? { segment } : {})
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
            
            // Ensure segment is stamped for one-time buyers in verify-payment as well
            if (segment) {
               const { error: segError } = await supabase.from('customers').update({ segment }).eq('email', customerEmail);
               // Fallback upsert if update missed (safety net)
               if (segError) await supabase.from('customers').upsert({ email: customerEmail, segment }, { onConflict: 'email' });
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

// --- Check Account Existence Endpoint ---
app.post('/api/user/check-account', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const { data } = await supabase.from('customers').select('id').eq('email', email).maybeSingle();
  res.json({ exists: !!data });
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

// --- Redeem Coupon Endpoint ---
app.post('/api/user/redeem-coupon', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

  const normalizedCode = code.toUpperCase().trim();
  
  // 1. Lookup Coupon in DB
  const { data: coupon } = await supabase
    .from('coupons')
    .select('credits')
    .eq('code', normalizedCode)
    .single();

  if (coupon) {
    // 1. Check for previous redemption
    const { data: existing } = await supabase
      .from('coupon_redemptions')
      .select('id')
      .eq('user_email', email)
      .eq('coupon_code', normalizedCode)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'You have already redeemed this coupon.' });
    }

    const creditsToAdd = coupon.credits;
    
    // 2. Log redemption (This will fail if unique constraint is violated, acting as a second lock)
    const { error: logError } = await supabase.from('coupon_redemptions').insert({ user_email: email, coupon_code: normalizedCode });
    if (logError) return res.status(500).json({ error: 'Failed to process coupon. You may have already used it.' });

    // 3. Grant credits
    const { error } = await supabase.rpc('add_credits', { user_email: email, amount: creditsToAdd });
    
    if (error) return res.status(500).json({ error: 'Failed to add credits' });

    // 4. Send Email via Resend
    await sendEmail(
      email,
      'You\'ve got credits! 🎟️',
      `
        <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">Welcome to your Free Trial!</h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">You've successfully redeemed code <strong>${normalizedCode}</strong>.</p>
        <p style="font-size: 18px; color: #111827;"><strong>${creditsToAdd}</strong> credits have been added to your account.</p>
        <div style="margin-top: 32px; text-align: center;">
          <a href="https://www.theproductshift.com/ai-powered-ux" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Run a Test Now</a>
        </div>
      `
    );

    return res.json({ success: true, creditsAdded: creditsToAdd, message: `Redeemed! ${creditsToAdd} tests added to your account.` });
  }

  return res.status(400).json({ error: 'Invalid or expired coupon code' });
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
  const { email, referralCode, segment } = req.body;
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
      const updates: any = {};
      if (existingCustomer.credits === null) updates.credits = 0;
      if (segment && !existingCustomer.segment) updates.segment = segment; // Stamp segment if missing
      
      if (Object.keys(updates).length > 0) {
        await supabase.from('customers').update(updates).eq('email', email);
      }
    } else {
      await supabase.from('customers').insert({ 
        email, 
        credits: 0,
        ...(segment ? { segment } : {})
      });
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
        
        // Send Welcome Email to Referee
        await sendEmail(
          email,
          'Referral Claimed! 🎁',
          `
            <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">You're in!</h1>
            <p style="font-size: 16px; color: #374151; line-height: 1.5;">You've successfully claimed a referral invite. We've added <strong>1 free test</strong> to your account so you can try Product Shift.</p>
            <p style="font-size: 16px; color: #374151; line-height: 1.5;">Once you run your first test, we'll also send a reward to the friend who invited you!</p>
            <div style="margin-top: 32px; text-align: center;">
              <a href="https://www.theproductshift.com/ai-powered-ux" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Run Your First Test</a>
            </div>
          `
        );

        return res.json({ success: true, message: 'Referral claimed. Run a test to unlock the reward for your friend!' });
      }
    }
    return res.status(400).json({ error: 'Invalid referral' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  // Diagnostic: List registered routes to debug 404s
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
    browserlessToken: process.env.BROWSERLESS_TOKEN ? 'SET' : 'MISSING',
    geminiApiKey: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
    supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING',
    activeRoutes: routes.filter(r => r.includes('/api/analyze')), // Only show relevant route
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

  console.log(`[RunTest] Processing request for: ${url}`);
  console.log(`[RunTest] Force Deploy Check: Test Mode Logic is Active`);

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!personaIds || !Array.isArray(personaIds) || personaIds.length === 0) {
    return res.status(400).json({ error: 'At least one persona is required' });
  }

  if (!goal) {
    return res.status(400).json({ error: 'A goal is required' });
  }

  // --- TEST MODE LOGIC (MOVED TO TOP) ---
  // We check this immediately to bypass all other logic (DB, Credits, AI) for test URLs.
  // Expanded to catch common typos like "test-demo"
  if (url.toLowerCase().includes('test-mode') || url.toLowerCase().includes('test-demo') || url.toLowerCase().includes('demo-mode')) {
    console.log('--- RUNNING IN TEST MODE (Bypass Engaged) ---');

    // DEDUCT CREDIT IF APPLICABLE (Even for test mode, to verify flow)
    if (email && supabaseUrl && supabaseServiceKey) {
        // We don't block on this, just fire and forget for the test
        const deductPromise = async () => {
            const { data: current } = await supabase.from('customers').select('credits').eq('email', email).single();
            if (current && current.credits > 0) {
                await supabase.from('customers').update({ credits: current.credits - 1 }).eq('email', email);
                console.log(`💳 Test Mode: Deducted 1 credit from ${email}`);
            }
        };
        deductPromise();
    }

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

    // Save to DB so Share Button works
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
        if (runError) console.error('Test Mode DB Insert Error (Using Fallback):', runError);
    }
    
    // Ensure we always have an ID in test mode so the button appears
    if (!reportId) reportId = 'test-mode-dummy-id';

    const fakeReport = {
        message: 'Analysis Complete.',
        reportId,
        title: 'Test Mode: The Product Shift',
        url: url,
        screenshot: '', 
        userSessions,
        expertReport,
        scores,
        seoSchema
    };
    // Add a small delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    return res.json(fakeReport);
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

  let runId: string | null = null;

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

  try {
    // --- TIMEOUT RACE START ---
    // We wrap the heavy lifting in a promise that rejects if it takes too long, preventing a 504.
    const analysisPromise = (async () => {
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
          // CTO UPDATE: Reduced delay from 6s to 1s to prevent Vercel 504 Timeouts.
          if (userSessions.length > 0) {
              await delay(1000);
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
          // Ignore duplicate key errors (race conditions), log others
          if (upsertError.code !== '23505') 
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
                await sendEmail(
                  email,
                  'You\'re out of credits',
                  `
                    <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">Running low?</h1>
                    <p style="font-size: 16px; color: #374151; line-height: 1.5;">You've used all your available tests.</p>
                    <p style="font-size: 16px; color: #374151; line-height: 1.5;">To continue analyzing sites and getting insights, upgrade your plan or grab a credit pack.</p>
                    <div style="margin-top: 32px; text-align: center;">
                      <a href="https://www.theproductshift.com/ai-powered-ux#pricing" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Get More Credits</a>
                    </div>
                  `
                );
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
             
             await sendEmail(
               referrer.email,
               'You earned a free test! 🎁',
               `
                 <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">Referral Reward Unlocked!</h1>
                 <p style="font-size: 16px; color: #374151; line-height: 1.5;">Your friend just ran their first test using your referral link.</p>
                 <p style="font-size: 16px; color: #374151; line-height: 1.5;">As a thank you, we've added <strong>1 free test</strong> to your account.</p>
                 <div style="margin-top: 32px; text-align: center;">
                   <a href="https://www.theproductshift.com/ai-powered-ux" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Use Your Credit</a>
                 </div>
               `
             );
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

        const { data: runLog, error: runLogError } = await supabase
          .from('analysis_runs')
          .insert({
            user_identifier: userIdentifier,
            url: url,
            persona_count: personaIds.length,
            estimated_cost: estimatedCost,
            is_demo: isDemo,
            plan_type: planType,
            revenue: revenue
          })
          .select('id')
          .single();
        
        if (runLog) runId = runLog.id;
        if (runLogError) console.error('Failed to log analysis run:', runLogError);
      }

      // --- Aggregated Expert Report ---
      await delay(1000); // Reduced delay for final report
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

      // --- FALLBACK SCORE LOGIC ---
      // If scores are missing (0) due to AI truncation, calculate heuristic scores based on sentiment.
      // This ensures the UI chart always renders something meaningful.
      if (scores.usability === 0 && scores.desirability === 0 && scores.clarity === 0) {
          let baseScore = 75;
          let sentimentDelta = 0;
          
          userSessions.forEach(session => {
              if (session.analysis.includes('|||USER_MOOD|||Positive')) sentimentDelta += 5;
              if (session.analysis.includes('|||USER_MOOD|||Negative')) sentimentDelta -= 5;
          });

          // Add slight randomness for organic feel
          const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
          
          scores = {
              usability: Math.min(98, Math.max(40, baseScore + sentimentDelta + r(-5, 5))),
              desirability: Math.min(98, Math.max(40, baseScore + sentimentDelta + r(-5, 5))),
              clarity: Math.min(98, Math.max(40, baseScore + sentimentDelta + r(-5, 5)))
          };
      }

      // Prepend the security warning if an SSL issue was detected
      if (!result.hasValidSsl) {
        expertReportText = '|||SSL_WARNING_ALERT|||\n' + expertReportText;
      }

      // Generate SEO Schema for this report
      const seoSchema = generateStructuredData(url, result.title, scores, expertReportText);

      // --- Update DB with Full Report Data ---
      if (runId && supabaseUrl && supabaseServiceKey) {
        // We store the structured data so the public endpoint can re-render it
        await supabase.from('analysis_runs').update({
          report_data: {
            title: result.title,
            url: url,
            scores,
            expertReport: expertReportText,
            userSessions: userSessions.map(({ persona, avatar, analysis, personaObj }) => ({ persona, avatar, analysis, description: personaObj.description }))
          }
        }).eq('id', runId);
      }

      return {
        message: 'Analysis Complete.',
        reportId: runId, // Send back ID so frontend could link to public report if needed
        title: result.title,
        url: url,
        screenshot: result.screenshot,
        userSessions: userSessions.map(({ persona, avatar, analysis, personaObj }) => ({ persona, avatar, analysis, description: personaObj.description })),
        expertReport: expertReportText,
        scores,
        seoSchema // Frontend can now inject this into the head of public pages
      };
    })(); // End of analysisPromise

    // Safety Valve: 54 second timeout (leaving 6s buffer for Vercel's 60s limit)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GRACEFUL_TIMEOUT')), 48000)
    );

    const finalResponse = await Promise.race([analysisPromise, timeoutPromise]);
    res.json(finalResponse);

  } catch (error: any) {
    // --- Graceful Timeout Handling ---
    if (error.message === 'GRACEFUL_TIMEOUT') {
      console.error('⚠️ Analysis timed out. Returning graceful fallback.');
      return res.json({
        message: 'Analysis Delayed',
        title: 'Analysis In Progress',
        url: url,
        screenshot: '', // We might not have it if browserless hung, or we could try to pass it out if we refactored deeper.
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
    
    // Log error to Supabase for Admin Dashboard
    if (supabaseUrl && supabaseServiceKey) {
      try {
        await supabase.from('error_logs').insert({
          error_message: `[${email || 'Anonymous'}] Failed to run test: ${errorMessage}`,
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
  const { planId, segment, applyDiscount, promotekit_referral } = req.body;
  const userEmail = req.body.email; // We'll get this from the user later

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is missing.');
    return res.status(500).json({ error: 'Server Configuration Error: Stripe key missing' });
  }

  try {
    let mode: Stripe.Checkout.SessionCreateParams.Mode = 'subscription';
    let lineItems = [];
    let metadata: any = {};
    let discounts = [];

    if (applyDiscount) {
      const coupon = await stripe.coupons.create({
        percent_off: 10,
        duration: 'once',
      });
      discounts.push({ coupon: coupon.id });
    }
    
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
    } else if (planId === 'pro') {
      mode = 'subscription';
      metadata = { ...metadata, credits: '40' }; // Pro plan gets 40 credits
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Pro Plan', description: '40 AI UX Audits per month' },
          unit_amount: 7900, // $79.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      });
    } else if (planId === 'agency') {
      mode = 'subscription';
      metadata = { ...metadata, credits: '100' }; // Agency plan gets 100 credits
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Agency Plan', description: '100 AI UX Audits per month' },
          unit_amount: 19900, // $199.00
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

    // Determine cancel URL based on segment
    let cancelPath = '/';
    if (segment === 'smb') cancelPath = '/simple-website-checkup';
    else if (segment === 'tech') cancelPath = '/landingpg-aiuxagent';

    // Construct session parameters defensively
    const sessionParams: any = {
      customer_email: userEmail, // Pass the user's email to pre-fill and link the customer
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      metadata: metadata, // Pass credits info to webhook
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}${segment ? `&segment=${segment}` : ''}`,
      cancel_url: `${req.headers.origin}${cancelPath}`,
    };

    // Only add optional fields if they are valid
    if (promotekit_referral) {
      console.log(`🔗 Attaching PromoteKit Referral ID: ${promotekit_referral}`);
      sessionParams.client_reference_id = promotekit_referral;
    }
    
    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    } else {
      sessionParams.allow_promotion_codes = true; // Only enable promo codes if no internal discount is active
      console.log('🎟️ Promo codes enabled for this session');
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});

// --- Cancel Account Endpoint ---
app.post('/api/user/cancel-account', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server config error' });

  try {
    // 1. Cancel Stripe Subscription if exists
    const { data: customer } = await supabase.from('customers').select('stripe_subscription_id').eq('email', email).single();
    if (customer?.stripe_subscription_id) {
      try {
        // Soft Cancel: Don't renew, but keep active until period ends. Allows for "Undo".
        await stripe.subscriptions.update(customer.stripe_subscription_id, { cancel_at_period_end: true });
      } catch (e) {
        console.error('Stripe cancel failed (might already be cancelled):', e);
      }
    }

    // 2. Update Database (Soft Cancel - Keep credits/account, just kill plan)
    await supabase.from('customers').update({ plan_status: 'cancelled' }).eq('email', email);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Undo Cancel Account Endpoint ---
app.post('/api/user/undo-cancel-account', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'Server config error' });

  try {
    const { data: customer } = await supabase.from('customers').select('stripe_subscription_id').eq('email', email).single();
    if (customer?.stripe_subscription_id) {
      // Reactivate subscription by removing the cancel_at_period_end flag
      await stripe.subscriptions.update(customer.stripe_subscription_id, { cancel_at_period_end: false });
    }

    // Restore status in DB
    await supabase.from('customers').update({ plan_status: 'active' }).eq('email', email);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Cron: Cleanup Inactive Users ---
// Call this endpoint via a scheduler (e.g. GitHub Actions, Vercel Cron, EasyCron)
// Header: Authorization: Bearer ADMIN_SECRET_KEY
app.get('/api/cron/cleanup-inactive-users', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).json({ error: 'DB Config Missing' });

  try {
    // 1. Find candidates: No active plan AND No credits
    const { data: candidates, error } = await supabase
      .from('customers')
      .select('email, created_at')
      .neq('plan_status', 'active')
      .lte('credits', 0);

    if (error) throw error;
    if (!candidates || candidates.length === 0) return res.json({ message: 'No inactive candidates found.' });

    const now = new Date();
    const results = { deleted: 0, warned1Month: 0, warned1Week: 0 };

    for (const user of candidates) {
      // Check last activity (Analysis Runs)
      const { data: lastRun } = await supabase
        .from('analysis_runs')
        .select('created_at')
        .eq('user_identifier', user.email) // Assuming user_identifier stores email or IP. If IP, this is loose. Ideally store email in analysis_runs.
        // Fallback: If analysis_runs doesn't have email, we rely on customer.created_at as the baseline for "activity" if they never ran a test.
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastActiveStr = lastRun?.created_at || user.created_at;
      const lastActive = new Date(lastActiveStr);
      const diffTime = Math.abs(now.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 90) {
        // > 90 Days: Delete
        await supabase.from('customers').delete().eq('email', user.email);
        console.log(`🗑️ Cron: Deleted inactive user ${user.email} (Inactive ${diffDays} days)`);
        results.deleted++;
      } else if (diffDays >= 83) {
        // ~1 Week remaining (83-89 days): Final Warning + Coupon
        console.log(`📧 Cron: Sending 1-week warning to ${user.email}. Coupon: COMEBACK10`);
        // TODO: Integrate Email Service
        results.warned1Week++;
      } else if (diffDays >= 60) {
        // ~1 Month remaining (60-82 days): First Warning
        console.log(`📧 Cron: Sending 1-month warning to ${user.email}`);
        // TODO: Integrate Email Service
        results.warned1Month++;
      }
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error('Cron Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Public Report Endpoint (SEO Optimized) ---
app.get('/api/public-report/:id', async (req, res) => {
  const { id } = req.params;

  // --- Test Mode Fallback ---
  if (id === 'test-mode-dummy-id') {
    const scores = { usability: 88, desirability: 92, clarity: 95 };
    const title = 'Test Mode: The Product Shift';
    const url = 'https://test-mode.com';
    const expertReport = '### TEST RESULT: PASS\nThis is a generated test report for verification purposes.';
    const seoSchema = generateStructuredData(url, `UX Audit: ${title}`, scores, expertReport);
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>UX Audit: ${title}</title>
        <script type="application/ld+json">${JSON.stringify(seoSchema)}</script>
        <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;}</style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>This is a static test report to verify the Share feature.</p>
      </body>
      </html>`;
    return res.send(html);
  }
  
  if (!supabaseUrl || !supabaseServiceKey) return res.status(500).send('Database not configured');

  try {
    const { data: run, error } = await supabase
      .from('analysis_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !run || !run.report_data) {
      return res.status(404).send('Report not found or expired.');
    }

    const { scores, expertReport, userSessions, title, url } = run.report_data;
    
    // Generate SEO Schema
    const seoSchema = generateStructuredData(url, `UX Audit: ${title}`, scores, expertReport);

    // Simple Server-Side Rendered HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UX Audit: ${title} | Product Shift</title>
        <meta name="description" content="AI-powered UX audit for ${url}. Usability Score: ${scores.usability}/100.">
        <script type="application/ld+json">${JSON.stringify(seoSchema)}</script>
        <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6} .score{font-weight:bold;font-size:24px}</style>
      </head>
      <body>
        <h1>UX Audit: ${title}</h1>
        <p><strong>Target URL:</strong> <a href="${url}">${url}</a></p>
        <div class="score">Usability Score: ${scores.usability}/100</div>
        <hr/>
        <div>${expertReport.replace(/\n/g, '<br>')}</div>
        <div style="margin-top:40px;padding:20px;background:#f3f4f6;text-align:center"><a href="https://www.theproductshift.com">Generate your own AI UX Audit</a></div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (e: any) {
    res.status(500).send('Error generating report');
  }
});

// --- Auth Status Endpoint (For Extension UI) ---
app.get('/api/auth/status', async (req, res) => {
  // 1. Extract Auth Token from cookies (Same logic as /analyze)
  let cookies = (req as any).cookies;
  
  if (!cookies && req.headers.cookie) {
    try {
      cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
        const parts = cookie.trim().split('=');
        const key = parts.shift();
        const val = parts.join('=');
        if (key) acc[key] = decodeURIComponent(val || '');
        return acc;
      }, {});
    } catch (e) {
      cookies = {};
    }
  }
  cookies = cookies || {};

  const authCookieKey = Object.keys(cookies).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
  const cookie = authCookieKey ? cookies[authCookieKey] : null;

  if (!cookie) {
    return res.json({ authenticated: false });
  }

  try {
    const token = JSON.parse(cookie)[0].access_token;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.json({ authenticated: false });
    }
    return res.json({ authenticated: true, email: user.email });
  } catch (e) {
    return res.json({ authenticated: false });
  }
});

app.post('/api/run-test', runTestHandler);

// --- Extension Endpoint (with Auth) ---
app.post('/api/analyze', async (req, res) => {
  console.log(`[Extension] Analyze request received for: ${req.body?.url}`);

  // 1. Extract Auth Token from cookies
  // Safely handle missing req.cookies (common in serverless Express without cookie-parser)
  let cookies = (req as any).cookies;
  
  // Fallback: Parse from header if req.cookies is undefined
  if (!cookies && req.headers.cookie) {
    try {
      cookies = req.headers.cookie.split(';').reduce((acc: any, cookie: string) => {
        // FIX: Handle cookies containing multiple '=' (like JSON tokens)
        const parts = cookie.trim().split('=');
        const key = parts.shift(); // Take the first part as key
        const val = parts.join('='); // Rejoin the rest as the value
        if (key) acc[key] = decodeURIComponent(val || '');
        return acc;
      }, {});
    } catch (e) {
      console.error('Error parsing cookie header:', e);
      cookies = {};
    }
  }
  
  cookies = cookies || {};

  const authCookieKey = Object.keys(cookies).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
  const cookie = authCookieKey ? cookies[authCookieKey] : null;

  if (!cookie) {
    return res.status(401).json({ error: 'Not authenticated. Please log in on the main site.' });
  }

  try {
    // 2. Verify Token and Get User
    // The cookie value is a JSON stringified array containing the session object.
    const token = JSON.parse(cookie)[0].access_token;
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: 'Authentication failed. Your session may have expired.' });
    }

    // 3. Inject required fields and call the main handler
    req.body.email = user.email; // Inject the authenticated user's email
    req.body.personaIds = ['alex-busy-pro']; // Default persona for the extension
    req.body.goal = 'Identify immediate UX friction points and conversion blockers.';
    return runTestHandler(req, res);
  } catch (e) {
    console.error("Auth error in /api/analyze:", e);
    return res.status(401).json({ error: 'Failed to process authentication token.' });
  }
});

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
    let paymentIntentId = session.payment_intent as string;

    // Fix: For subscriptions, payment_intent is often on the invoice, not the session.
    if (!paymentIntentId && session.invoice) {
      const invoice = await stripe.invoices.retrieve(session.invoice as string);
      paymentIntentId = invoice.payment_intent as string;
    }

    if (!paymentIntentId) return res.status(400).json({ error: 'Could not resolve Payment Intent ID from Stripe Session.' });

    // 3. Issue Refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer',
      metadata: {
        admin_note: 'Refunded via Admin Dashboard'
      }
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

// --- Admin Invite User Endpoint ---
app.post('/api/admin/invite-user', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { email, credits, segment, duration } = req.body;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    console.log(`🚀 Admin Invite Initiated for: ${email}`);

    // 1. Ensure customer row exists (This "whitelists" them so Login.tsx won't block them later)
    const { error: dbError } = await supabase
      .from('customers')
      .upsert({ 
        email, 
        credits: credits || 0, 
        plan_status: 'gifted', 
        segment: segment || 'tech'
      }, { onConflict: 'email' });

    if (dbError) throw dbError;
    console.log(`✅ Customer row upserted for ${email}`);

    // 2. Ensure Auth User Exists (Critical Fix for Admin Invites)
    // We must create the user in the Auth system before we can generate a link for them.
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm to suppress default Supabase email
      password: Math.random().toString(36).slice(-12) + 'Aa1!',
      user_metadata: { source: 'admin_invite' }
    });
    
    if (createError && !createError.message.includes('already registered')) {
       // Log but continue, as they might already exist
       console.log('⚠️ User create warning (might exist):', createError.message);
    }

    // 3. Generate Magic Link via Supabase Admin
    // We append the segment to the URL so the frontend can adapt the UI immediately upon arrival
    const redirectUrl = `https://www.theproductshift.com/ai-powered-ux?new_credit=true&segment=${segment || 'tech'}`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) throw linkError;

    // Supabase is now configured to generate the correct 'www' link directly.
    console.log(`🔗 Magic Link Generated for ${email}`);
    const actionLink = linkData.properties.action_link;

    // 4. Send Custom Email via Resend
    await sendEmail(
      email,
      'Your Product Shift Free Trial 🎟️',
      `
        <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">You're invited!</h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">You've been granted a free trial to Product Shift.</p>
        <p style="font-size: 18px; color: #111827;">We've added <strong>${credits || 0} free tests</strong> to your account.</p>
        ${duration ? `<p style="font-size: 14px; color: #dc2626; font-weight: bold;">Note: This trial expires in ${duration}.</p>` : ''}
        <div style="margin-top: 32px; text-align: center;">
          <a href="${actionLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Account</a>
        </div>
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280; text-align: center;">This secure link expires in 24 hours.</p>
      `
    );

    console.log(`✅ Invite process completed for ${email}`);
    res.json({ success: true, message: 'Invite sent successfully!' });
  } catch (e: any) {
    console.error('Invite Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Admin Compensate User Endpoint ---
app.post('/api/admin/compensate-user', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { email, credits } = req.body;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Grant credits
    await supabase.rpc('add_credits', { user_email: email, amount: credits });

    // Send Apology Email
    await sendEmail(
      email,
      'Credits added to your account',
      `
        <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">We're sorry about the hiccup!</h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">We noticed you experienced an error recently. To make it up to you, we've added <strong>${credits} free tests</strong> to your account.</p>
        <p style="font-size: 16px; color: #374151;">Please try running your analysis again.</p>
        <div style="margin-top: 32px; text-align: center;">
          <a href="https://www.theproductshift.com/ai-powered-ux" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Try Again</a>
        </div>
      `
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin Diagnostic Endpoint ---
app.get('/api/admin/diagnose-link', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'diagnostic@test.com',
      options: {
        redirectTo: 'https://www.theproductshift.com/diagnostic-redirect'
      }
    });

    if (linkError) throw linkError;

    const rawLink = linkData.properties.action_link;
    const isCorrect = !rawLink.includes('app.theproductshift.com');

    res.json({
      message: "This is the raw link Supabase generates based on its 'Site URL' setting.",
      raw_action_link: rawLink,
      is_configured_correctly: isCorrect,
      recommendation: isCorrect
        ? "Supabase 'Site URL' appears to be correct. No action needed."
        : "Supabase 'Site URL' is incorrect. It should be updated to 'https://www.theproductshift.com' in your Supabase project settings under Auth -> URL Configuration. Our backend code is currently fixing this manually."
    });

  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin Create Coupon Endpoint ---
app.post('/api/admin/create-coupon', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { code, credits } = req.body;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase.from('coupons').insert({ code: code.toUpperCase(), credits });
  
  if (error) return res.status(500).json({ error: error.message });
  
  res.json({ success: true, message: `Coupon ${code.toUpperCase()} created!` });
});

// --- Admin Get Coupons Endpoint ---
app.get('/api/admin/coupons', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Admin Delete Coupon Endpoint ---
app.delete('/api/admin/coupons/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { id } = req.params;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase.from('coupons').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  
  res.json({ success: true });
});

// --- Custom Auth Login Endpoint (Branded Magic Links) ---
app.post('/api/auth/login', async (req, res) => {
  const { email, redirectTo, coupon } = req.body;
  
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    console.log(`🔐 Auth Login Request for: ${email}`);
    
    let finalRedirect = redirectTo || 'https://www.theproductshift.com/ai-powered-ux';
    if (coupon) {
      const separator = finalRedirect.includes('?') ? '&' : '?';
      finalRedirect = `${finalRedirect}${separator}coupon=${coupon}`;
    }

    // 1. Ensure User Exists & Is Confirmed
    // We attempt to create the user with email_confirm: true.
    // This suppresses the default Supabase SMTP email so we can send our branded one.
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, 
      password: Math.random().toString(36).slice(-12) + 'Aa1!',
      user_metadata: { source: 'magic_link_flow' }
    });

    // If user already exists, we just proceed to generate the link.
    
    // 2. Generate the Magic Link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: finalRedirect
      }
    });

    if (linkError) throw linkError;

    // Send Branded Email
    // Supabase is now configured to generate the correct 'www' link directly.
    const magicLink = linkData.properties.action_link;
    
    await sendEmail(
      email,
      'Sign in to Product Shift',
      `
        <h1 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 800; text-align: center;">Sign in to Product Shift</h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.5;">Click the button below to sign in to your account. This link will expire in 24 hours.</p>
        <div style="margin-top: 32px; text-align: center;">
          <a href="${magicLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sign In Now</a>
        </div>
        <p style="margin-top: 24px; font-size: 14px; color: #6b7280; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        <p style="margin-top: 12px; font-size: 14px; color: #6b7280; text-align: center;">Link expired? You can always go back to <a href="https://www.theproductshift.com" style="color: #4f46e5; text-decoration: none;">theproductshift.com</a> for another magic link.</p>
      `
    );

    res.json({ success: true });
  } catch (e: any) {
    console.error('Login Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- Admin Get Test Users Endpoint ---
app.get('/api/admin/test-users', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch users from Auth (Limit to 1000 for now to be safe)
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    const testPatterns = ['test', 'demo', 'example', 'localhost', '+smb', 'jeankaluza+'];
    
    const testUsers = users.filter(u => {
      const email = u.email?.toLowerCase() || '';
      return testPatterns.some(p => email.includes(p));
    }).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at
    }));

    res.json(testUsers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin Bulk Delete Users Endpoint ---
app.post('/api/admin/delete-users', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const { users } = req.body; // Expects array of { id, email }

  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ error: 'Invalid users array' });
  }

  try {
    const emails = users.map((u: any) => u.email).filter(Boolean);
    const ids = users.map((u: any) => u.id).filter(Boolean);

    // 1. Delete from Public Tables (using emails)
    if (emails.length > 0) {
      await supabase.from('analysis_runs').delete().in('user_identifier', emails);
      await supabase.from('payments').delete().in('email', emails);
      await supabase.from('referrals').delete().in('referee_email', emails);
      await supabase.from('coupon_redemptions').delete().in('user_email', emails);
      await supabase.from('daily_usage').delete().in('user_identifier', emails);
      await supabase.from('customers').delete().in('email', emails);
    }

    // 2. Delete from Auth (using IDs)
    const results = await Promise.allSettled(ids.map((id: string) => supabase.auth.admin.deleteUser(id)));
    
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('Some user deletions failed', failed);
    }

    res.json({ success: true, deletedCount: ids.length - failed.length });
  } catch (e: any) {
    console.error('Bulk Delete Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  const authHeader = req.headers.authorization;
  const secretKey = process.env.ADMIN_SECRET_KEY;
  const excludeTestData = req.query.exclude_test_data === 'true';

  const isTestUser = (identifier: string | null) => {
    if (!identifier) return false;
    const lower = identifier.toLowerCase();
    return lower.includes('test') || lower.includes('demo') || lower.includes('example') || lower.includes('localhost') || lower.includes('+smb');
  };

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
        .select('count, user_identifier')
        .eq('usage_date', today);
    
    if (usageError) throw usageError;
    
    const filteredUsage = excludeTestData ? usageData?.filter(u => !isTestUser(u.user_identifier)) : usageData;
    const dailyUsage = filteredUsage?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    // Get Waitlist Count
    const { data: waitlistData, error: waitlistError } = await supabase
        .from('waitlist_emails')
        .select('email');
    
    if (waitlistError) throw waitlistError;
    const filteredWaitlist = excludeTestData ? waitlistData?.filter(w => !isTestUser(w.email)) : waitlistData;

    // Get Referral Count
    const { data: referralData } = await supabase
        .from('referrals')
        .select('referee_email');
    const filteredReferrals = excludeTestData ? referralData?.filter(r => !isTestUser(r.referee_email)) : referralData;

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
        .limit(5);

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
      .select('amount_total, status, created_at, email')
      .eq('status', 'paid'); // Only count successful payments
    
    const filteredPayments = excludeTestData ? allPayments?.filter(p => !isTestUser(p.email)) : allPayments;
    
    const totalRevenueCents = filteredPayments?.reduce((acc, curr) => acc + curr.amount_total, 0) || 0;
    
    // Breakdown by Plan (Heuristic based on price points)
    const salesBreakdown = {
      pack3: filteredPayments?.filter(p => p.amount_total === 1400).length || 0,
      pack15: filteredPayments?.filter(p => p.amount_total === 6900).length || 0,
      starter: filteredPayments?.filter(p => p.amount_total === 2900).length || 0,
    };

    // Get Recent Payments (for Admin Review/Refunds)
    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({ 
        dailyUsage, 
        waitlistCount: filteredWaitlist?.length || 0, 
        referralCount: filteredReferrals?.length || 0, 
        recentErrors: recentErrors || [], 
        recentRuns: recentRuns || [], 
        recentSubscribers: recentSubscribers || [], 
        totalRevenue: totalRevenueCents / 100, 
        salesBreakdown, 
        recentPayments 
    });
  } catch (error: any) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

// --- 404 Catch-All Logger ---
// If a request gets here, no route matched. Log it for debugging.
app.use((req, res) => {
  console.log(`[404] No route matched for: ${req.method} ${req.path}`);
  res.status(404).send(`Cannot ${req.method} ${req.path}`);
});

// Export the app for Vercel
export default app;
