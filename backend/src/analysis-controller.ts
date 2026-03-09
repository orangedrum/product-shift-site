import { Request, Response } from 'express';
import { supabase, sendEmail, delay } from './services';
import { generateContentWithFallback } from './ai-service';
import { marketingEmails } from './email-templates';

// --- Types ---
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

// --- Personas Configuration ---
export const personas: Record<string, Persona> = {
  'alex-busy-pro': { id: 'alex-busy-pro', name: 'Alex', description: 'a busy professional with two kids under 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' },
  'sam-college-student': { id: 'sam-college-student', name: 'Sam', description: 'a budget-conscious college student', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sam' },
  'charlie-family-worker': { id: 'charlie-family-worker', name: 'Charlie', description: 'a masculine, patriotic blue-collar worker', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Charlie' },
  'beth-homemaker': { id: 'beth-homemaker', name: 'Beth', description: 'a 45+ family-oriented homemaker with poor eyesight', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Beth' },
  'sarah-social-shopper': { id: 'sarah-social-shopper', name: 'Sarah', description: 'a social influencer and avid shopper', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah' },
  'elizabeth-wealthy-elite': { id: 'elizabeth-wealthy-elite', name: 'Elizabeth', description: 'a highly educated and wealthy individual with deep connections', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Katherine' },
  'marcus-c-suite': { id: 'marcus-c-suite', name: 'Marcus', description: 'a C-level executive of a Fortune 500 company', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus' },
  'linda-business-owner': { id: 'linda-business-owner', name: 'Linda', description: 'a business owner with 10 employees', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Linda' },
};

// --- Helper Functions ---

export const normalizeUrl = (input: string) => {
  let url = input.trim();
  // Fix double protocol (e.g. https://https://) caused by double-pasting into a pre-filled field
  while (/^https?:\/\/https?:\/\//i.test(url)) {
    url = url.replace(/^https?:\/\//i, '');
  }
  // Default to https:// if no protocol is present
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
};

export const scrapeUrl = async (url: string) => {
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessToken) throw new Error('BROWSERLESS_TOKEN is missing in environment variables.');

  const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessToken.trim()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `export default async function({ page, context }) {
        const url = context.url;
        // Optimize: Use domcontentloaded + short sleep instead of networkidle2 to prevent timeouts on heavy sites
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await new Promise(r => setTimeout(r, 5000)); // CTO UPDATE: Increased to 5s to ensure full hydration/rendering for accuracy
        const title = await page.title();
        const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 8000));
        const headings = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: h.innerText })));
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: false, encoding: 'base64' });
        return { data: { title, bodyText, headings, screenshot }, type: 'application/json' };
      };`,
      context: { url }
    })
  });

  if (!response.ok) throw new Error(`Browserless Error: ${response.status} - ${await response.text()}`);
  const jsonResponse = await response.json();
  
  // Fix: Ensure screenshot is a proper base64 string.
  // Browserless/Puppeteer serialization can sometimes return a Buffer object or a byte string.
  if (jsonResponse.data && jsonResponse.data.screenshot) {
    const s = jsonResponse.data.screenshot;
    if (typeof s === 'object' && s.type === 'Buffer') {
       jsonResponse.data.screenshot = Buffer.from(s.data).toString('base64');
    } else if (typeof s === 'string' && s.indexOf(',') > -1 && /^\d+,\d+/.test(s)) {
       // Handle comma-separated byte string (e.g. "255,216,255...") seen in logs
       const bytes = s.split(',').map((b: string) => parseInt(b.trim()));
       jsonResponse.data.screenshot = Buffer.from(bytes).toString('base64');
    }
  }
  
  return jsonResponse.data;
};

export const generateStructuredData = (url: string, title: string, scores: any, summary: string) => {
  const cleanSummary = summary.replace(/[#*]/g, '').split('\n').filter(line => line.trim().length > 0).slice(0, 3).join(' ');
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": { "@type": "Organization", "name": title, "url": url },
    "reviewRating": { "@type": "Rating", "ratingValue": scores.usability, "bestRating": "100", "worstRating": "0" },
    "author": { "@type": "Organization", "name": "Product Shift AI" },
    "reviewBody": cleanSummary,
    "datePublished": new Date().toISOString()
  };
};

export const generateUserSession = async (data: ScrapedData, persona: Persona, goal: string, url: string): Promise<string> => {
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

    **CRITICAL INSTRUCTION FOR USER_BUBBLE:**
    You must NOT sound like a generic UX report. You MUST roleplay as ${persona.name}.
    Your response must be a visceral, first-person "I" statement that directly connects a UX flaw to your specific life context from your description: "${persona.description}".

    **Required Output Format:**
    |||USER_MOOD|||
    (One word: Positive, Neutral, or Negative)
    |||USER_BUBBLE|||
    (A single, vivid, first-person sentence. **Golden Record Example:** "I'm stuck staring at a loading spinner while my kids are screaming, and I just need to know if the payment went through!")
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

export const generateAggregatedReport = async (data: ScrapedData, sessions: { persona: Persona, output: string }[], goal: string, url: string, isDemo: boolean): Promise<string> => {
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

// --- Main Handler ---
export const runTestHandler = async (req: Request, res: Response) => {
  console.log(`[runTestHandler] START - Request received for URL: ${req.body.url}`);
  let creditDeducted = false;
  let userIdentifier: string | undefined;

  try {
    const { url: rawUrl, personaIds, goal, email } = req.body;

    if (!rawUrl || !personaIds || !goal) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const url = normalizeUrl(rawUrl);
    console.log(`[runTestHandler] Normalized URL: ${url}`);

    // Fix: Use x-forwarded-for to get real IP behind Vercel/proxies
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip'];
    
    let clientIp: string | undefined;

    if (typeof forwarded === 'string') {
      clientIp = forwarded.split(',')[0].trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      clientIp = forwarded[0].trim();
    }

    userIdentifier = clientIp || (typeof realIp === 'string' ? realIp : undefined) || (typeof cfConnectingIp === 'string' ? cfConnectingIp : undefined) || req.ip || 'unknown';
    let planType = 'free';
    let revenue = 0;
    let useFreeTier = true;
    let shouldDeductCredit = false;
    let runId: string | null = null;

    if (email && typeof email === 'string') {
      const safeEmail = email.trim().toLowerCase();
      userIdentifier = safeEmail;
      useFreeTier = false;

      let { data: customer } = await supabase.from('customers').select('*').eq('email', safeEmail).maybeSingle();
      
      if (!customer) {
          const { data: newCust, error: createErr } = await supabase
              .from('customers')
              .insert({ email: safeEmail, credits: 5, plan_status: 'free' })
              .select()
              .single();
          if (!createErr) customer = newCust;
      }

      if (customer && customer.plan_status === 'active') {
        planType = 'subscription';
      } else {
        planType = 'credit_pack';
        shouldDeductCredit = true;
      }
    }

    // --- REFERRAL REWARD LOGIC (Moved to Start) ---
    // We process this immediately to ensure the referrer is rewarded even if the AI times out later or if using Test Mode.
    if (email) {
      // Use userIdentifier (safeEmail) to ensure case-insensitive matching
      const { data: cust } = await supabase.from('customers').select('referred_by, referrer_rewarded').eq('email', userIdentifier).single();
      
      if (cust && cust.referred_by && !cust.referrer_rewarded) {
         const referrerEmail = cust.referred_by;
         
         // CRITICAL SAFETY: Ensure we don't reward the user for referring themselves
         console.log(`🔍 Referral Check: Referee=${userIdentifier}, Referrer=${referrerEmail}`);
         // This prevents the "6 credits" bug where the referee gets the reward
         if (referrerEmail.toLowerCase() !== userIdentifier.toLowerCase()) {
           console.log(`🎁 REFERRAL EVENT: Referee (${userIdentifier}) completed first test. Rewarding Referrer (${referrerEmail}).`);
           
           try {
             // 1. Add Credits to Referrer (Direct Update to ensure target accuracy)
             // We fetch the current credits first to ensure atomic-like behavior via the service key
             const { data: refData, error: fetchError } = await supabase.from('customers').select('credits').eq('email', referrerEmail).single();
             
             if (refData && !fetchError) {
               const newCredits = (refData.credits || 0) + 3;
               const { error: updateError } = await supabase.from('customers').update({ credits: newCredits }).eq('email', referrerEmail);
               if (updateError) throw updateError;
               console.log(`✅ SUCCESS: Updated ${referrerEmail} credits from ${refData.credits} to ${newCredits}`);
             } else {
               console.error(`❌ FAILED: Could not fetch referrer ${referrerEmail} to add credits.`);
             }
             
             // 2. Notify Referrer
             await supabase.from('notifications').insert({
               user_email: referrerEmail,
               message: `You earned 3 credits! A user you referred just ran their first test.`,
               type: 'success'
             });

             // 3. Update Referrer Stats (Count & Champion Status)
             const { data: referrer } = await supabase.from('customers').select('id, referral_count').eq('email', referrerEmail).single();
             if (referrer) {
               const newCount = (referrer.referral_count || 0) + 1;
               const updates: any = { referral_count: newCount };
               
               const { count: paymentCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('email', referrerEmail).eq('status', 'paid');
               if ((paymentCount || 0) >= 3) {
                  updates.is_champion = true;
                  updates.date_became_champion = new Date().toISOString();
               }
               await supabase.from('customers').update(updates).eq('id', referrer.id);
             }

             // 4. Mark as rewarded so we don't pay out again
             await supabase.from('customers').update({ referrer_rewarded: true }).eq('email', userIdentifier);
           } catch (err) {
             console.error('Error rewarding referrer:', err);
           }
         } else {
           // If self-referral detected, just mark as rewarded to stop trying
           await supabase.from('customers').update({ referrer_rewarded: true }).eq('email', userIdentifier);
         }
      }
    }

    // --- TEST MODE BYPASS ---
    if (url.toLowerCase().includes('test-mode') || url.toLowerCase().includes('test-demo') || url.toLowerCase().includes('demo-mode')) {
      if (shouldDeductCredit) {
          const { error: deductError } = await supabase.rpc('deduct_credits', { user_email: userIdentifier, amount: 3 });
          if (deductError) return res.status(402).json({ error: 'Insufficient Credits', details: 'Please top up to run this test.' });
      }

      const scores = { usability: 88, desirability: 92, clarity: 95 };
      const expertReport = '### TEST RESULT: PASS\n**Overall Score:** 92/100\nThe site demonstrates strong clarity and desirability.\n\n### Visual & Heuristic Analysis\n- **Visual Hierarchy:** [Positive] The primary headline and CTA are distinct.\n\n### Actionable Recommendations\n- **ISSUE:** Pricing transparency is lacking.\n- **FIX:** Add a "starting at" price.';
      const userSessions = [{
          persona: 'Alex',
          avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra',
          analysis: '|||USER_MOOD|||Positive|||USER_BUBBLE|||I instantly get what this is. The value prop is super clear.|||USER_DETAILS|||### 1. My Experience\nI landed on the page and immediately understood the offering. The headline "AI-Powered UX Audits" is punchy. I feel confident this tool could save me time.\n\n### 2. Points of Friction\nI\'m not sure about the pricing structure. It says "Pro" but doesn\'t list a price upfront. That\'s a bit annoying.\n\n### 3. What I Think This Is\nIt\'s an automated user testing tool that uses AI agents instead of real people to give quick feedback.',
          description: 'a busy professional with two kids under 5',
          personaObj: { id: 'alex-busy-pro', name: 'Alex', description: 'a busy professional with two kids under 5', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alexandra' }
      }];

      const seoSchema = generateStructuredData(url, 'Test Mode: The Product Shift', scores, expertReport);
      return res.json({
          message: 'Analysis Complete.',
          reportId: 'test-mode-dummy-id',
          title: 'Test Mode: The Product Shift',
          url: url,
          screenshot: '', 
          userSessions: userSessions.map(s => ({ persona: s.persona, avatar: s.avatar, analysis: s.analysis, description: s.description })),
          expertReport,
          scores,
          seoSchema
      });
    }

    if (useFreeTier) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase.from('daily_usage').select('count').eq('user_identifier', userIdentifier).eq('usage_date', today).single();
      if (usage && usage.count >= 3) {
        console.log(`[Limit Reached] User: ${userIdentifier}, Count: ${usage.count}`);
        return res.status(402).json({ error: 'Insufficient Credits', details: 'You have reached your daily free limit. Please upgrade or buy a credit pack.' });
      }
    }

    console.log(`[runTestHandler] DEBUG - Entering analysisPromise for user: ${userIdentifier}`);
    const analysisPromise = (async () => {
      if (shouldDeductCredit) {
          const { error: deductError } = await supabase.rpc('deduct_credits', { user_email: userIdentifier, amount: 3 });
          if (deductError) throw new Error(`Credit deduction failed: ${deductError.message}`);
          creditDeducted = true;

        // Trigger emails based on remaining credit and time since last low credit warning
        const { data: customerData } = await supabase
          .from('customers')
          .select('credits, last_low_credit_warning')
          .eq('email', userIdentifier)
          .single();

        if (customerData && customerData.credits <= 2) {
          const now = new Date();
          const lastWarning = customerData.last_low_credit_warning ? new Date(customerData.last_low_credit_warning) : null;
          const diffDays = lastWarning ? Math.floor((now.getTime() - lastWarning.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
          const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.theproductshift.com';

          // 1. Immediate Low Credit Warning
          if (!lastWarning) {
            sendEmail(userIdentifier, marketingEmails.lowCredits.subject, marketingEmails.lowCredits.body(baseUrl))
              .catch(err => console.error('Failed to send low credit email:', err));
            await supabase.from('customers').update({ last_low_credit_warning: now.toISOString() }).eq('email', userIdentifier);
          } 
          // 2. Week Later - Check If Credits are still low && has not been warned a second time in a week.
          else if (diffDays >= 7 && diffDays < 14) {
            sendEmail(userIdentifier, marketingEmails.lowCreditsReminder.subject, marketingEmails.lowCreditsReminder.body(baseUrl))
              .catch(err => console.error('Failed to send low credit reminder email:', err));
          }
          else {
            console.warn(`Throttling low credits email for ${userIdentifier}: last sent ${diffDays} days ago`);
          }
        }
      }

      const result = await scrapeUrl(url);

      // CTO FIX: Run user session generation in parallel to avoid timeouts.
      const sessionPromises = personaIds.map(async (pId: string) => {
        const activePersona = personas[pId] || personas['alex-busy-pro'];
        if (activePersona) {
          const sessionOutput = await generateUserSession(result, activePersona, goal, url);
          const moodMatch = sessionOutput.match(/\|\|\|USER_MOOD\|\|\|\s*(.*)/);
          const mood = moodMatch ? moodMatch[1].trim() : 'Neutral';
          let avatarUrl = activePersona.avatar;
          if (mood.toLowerCase().includes('negative')) avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${activePersona.name}&mouth=sad`;
          if (mood.toLowerCase().includes('positive')) avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${activePersona.name}&mouth=smile`;
          return { persona: activePersona.name, avatar: avatarUrl, analysis: sessionOutput, personaObj: activePersona };
        }
        return null;
      });

      const userSessions = (await Promise.all(sessionPromises)).filter(s => s !== null);

      await delay(1000);
      let rawExpertReport = await generateAggregatedReport(result, userSessions.map(s => ({ persona: s.personaObj, output: s.analysis })), goal, url, false);
      let scores = { usability: 0, desirability: 0, clarity: 0 };
      if (rawExpertReport.includes('|||SCORES_JSON|||')) {
        const parts = rawExpertReport.split('|||SCORES_JSON|||');
        try { scores = JSON.parse(parts[1].match(/\{[\s\S]*?\}/)?.[0] || parts[1].trim()); } catch (e) {}
        rawExpertReport = parts[0];
      }

      const overallScore = Math.round((scores.usability + scores.desirability + scores.clarity) / 3);
      const calculatedResult = overallScore >= 60 ? 'PASS' : 'FAIL';
      rawExpertReport = rawExpertReport.replace(/### TEST RESULT:.*(\n|$)/i, `### TEST RESULT: ${calculatedResult}\n**Overall Score:** ${overallScore}/100\n`);

      if (useFreeTier) {
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('daily_usage').upsert({ user_identifier: userIdentifier, usage_date: today, count: 1 });
      }

      const { data: runLog } = await supabase.from('analysis_runs').insert({
        user_identifier: userIdentifier, url: url, persona_count: personaIds.length, estimated_cost: 0, is_demo: false, plan_type: planType, revenue: revenue,
        report_data: { title: result.title, screenshot: result.screenshot, url: url, scores, expertReport: rawExpertReport, userSessions: userSessions.map(s => ({ persona: s.persona, avatar: s.avatar, analysis: s.analysis, description: s.personaObj.description })) }
      }).select('id').single();
      
      if (runLog) runId = runLog.id;
      const seoSchema = generateStructuredData(url, result.title, scores, rawExpertReport);

      return { message: 'Analysis Complete.', reportId: runId, title: result.title, url: url, screenshot: result.screenshot, userSessions: userSessions.map(s => ({ persona: s.persona, avatar: s.avatar, analysis: s.analysis, description: s.personaObj.description })), expertReport: rawExpertReport, scores, seoSchema };
    })();

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('GRACEFUL_TIMEOUT')), 58000));
    
    console.log(`[runTestHandler] DEBUG - Awaiting Promise.race`);
    const finalResponse = await Promise.race([analysisPromise, timeoutPromise]);

    console.log(`[runTestHandler] SUCCESS - Analysis complete. Sending response.`);
    res.json(finalResponse);

  } catch (error: any) {
    console.error(`[runTestHandler] FATAL ERROR - ${error.message}`, error);
    if (creditDeducted && userIdentifier) {
      console.log(`[runTestHandler] REFUND - Refunding 3 credits to ${userIdentifier}`);
      await supabase.rpc('add_credits', { user_email: userIdentifier, amount: 3 });
    }
    res.status(500).json({ error: 'Analysis Failed', details: error.message, usageCounted: false });
  }
};