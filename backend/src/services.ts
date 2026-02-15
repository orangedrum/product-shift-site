import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder'
);

// --- Stripe Initialization ---
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// --- Email Config ---
export const emailFrom = process.env.EMAIL_FROM || 'Product Shift <onboarding@theproductshift.com>';

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

// --- Helper: Identify Test Users ---
export const isTestEmail = (email: string) => {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower.includes('test') || 
         lower.includes('demo') || 
         lower.includes('example') || 
         lower.includes('localhost') ||
         lower.includes('+smb');
};