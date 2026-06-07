import express from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder'
);

// --- Stripe Initialization ---
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// --- Email Config ---
export const emailFrom = (process.env.EMAIL_FROM || '"Product Shift" <onboarding@theproductshift.com>')
  .replace(/&amp;lt;/g, '<').replace(/&lt;/g, '<')
  .replace(/&amp;gt;/g, '>').replace(/&gt;/g, '>')
  // Safety: If display name contains spaces and isn't quoted, wrap it in double quotes for deliverability.
  .replace(/^([^"].*?\s+.*?)\s*<(.+)>$/, '"$1" <$2>');

// --- Reply-To Config ---
// This ensures that if a user replies to an automated email, it goes to a real person.
export const replyToEmail = process.env.REPLY_TO_EMAIL || 'onboarding@theproductshift.com';

// --- Canonical URL Helper ---
// Use a dedicated env var for public-facing URLs to avoid using Vercel deployment URLs.
export const getPublicUrl = (req?: any) => {
  // Priority 1: Dynamic detection from request (Branch-specific)
  if (req) {
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      return origin.replace(/\/$/, '').split('/api')[0].split('?')[0];
    }
  }
  
  // Priority 2: Vercel Deployment URL (Automatic fallback for Crons/Webhooks)
  if (process.env.VERCEL_URL && !process.env.PUBLIC_CANONICAL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.PUBLIC_CANONICAL_URL || 'https://www.theproductshift.com';
}

// --- Helper: Delay ---
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Email Template Helper ---
export const getEmailTemplate = (content: string, baseUrl: string = 'https://www.theproductshift.com') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Shift</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
    
    <!-- Brand Header -->
    <div style="text-align: center; padding: 32px; border-bottom: 1px solid #f3f4f6;">
      <a href="${baseUrl}" style="text-decoration: none;">
        <img src="https://www.theproductshift.com/logo.png" alt="Product Shift" style="height: 40px; width: auto; border: 0;" />
      </a>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #6b7280; font-weight: 500;">User Mirror by Product Shift</p>
    </div>

    <div style="padding: 40px;">
      ${content}
      <hr style="border: none; border-top: 2px solid #f3f4f6; margin: 32px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0 0 8px 0;">
        <a href="${baseUrl}/account" style="color: #6b7280; text-decoration: underline;">Unsubscribe / Manage Preferences</a>
      </p>
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} The Product Shift. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// --- Email Sender ---
export const sendEmail = async (to: string, subject: string, html: string, baseUrl: string = 'https://www.theproductshift.com') => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('Resend API key missing. Skipping email.');
    return { success: false, error: 'Resend API Key missing' };
  }
  const fullHtml = getEmailTemplate(html, baseUrl);
  try {
    const payload = { 
      from: emailFrom.trim(), 
      to, 
      subject, 
      html: fullHtml,
      reply_to: replyToEmail.trim()
    };
    console.log(`📨 Resend Payload (Sanitized):`, JSON.stringify({ ...payload, html: '(html_content_hidden)' }));
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Resend API Error:', errorData);
      return { success: false, error: errorData, from: emailFrom };
    }
    const data = await res.json();
    console.log(`✅ Resend Response:`, JSON.stringify(data));
    return { success: true, data };
  } catch (e) {
    console.error('Failed to send email:', e);
    return { success: false, error: e, from: emailFrom };
  }
};

// --- Helper: Identify Test Users ---
export const isTestEmail = (email: string) => {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower.includes('test') || 
         lower.includes('demo') || 
         lower.includes('example') || 
         lower.includes('localhost') ||
         lower.includes('+smb') ||
         lower.includes('jeankaluza') ||
         lower.includes('productshift');
};

// --- Referrer Reward Logic (Triggered after first test) ---
export const processReferrerReward = async (refereeEmail: string) => {
  const { data: referee } = await supabase
    .from('customers')
    .select('referred_by, referrer_rewarded')
    .eq('email', refereeEmail)
    .single();

  if (referee?.referred_by && !referee.referrer_rewarded) {
    console.log(`🎁 Rewarding referrer ${referee.referred_by} for ${refereeEmail}'s first test.`);
    
    // 1. Add Credits
    await supabase.rpc('add_credits', { user_email: referee.referred_by, amount: 3 });
    
    // 2. Mark as rewarded
    await supabase.from('customers').update({ referrer_rewarded: true }).eq('email', refereeEmail);
    
    // 3. Increment referrer's count for Champion status
    await supabase.from('notifications').insert({
      user_email: referee.referred_by,
      message: `You earned 3 credits! A user you referred just ran their first test.`,
      type: 'success'
    });
  }
};

// --- AUTH MIDDLEWARE (Shared) ---
export const authenticateRequest = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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