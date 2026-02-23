// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const storageStatePath = 'storageState.json';

  // Use Supabase Admin to generate a session for the test user
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = 'playwright-test@example.com';
  const testPassword = 'password1!'; // Not used for magic link, but good to have if we switch

  if (supabaseUrl && supabaseServiceKey) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 1. Generate the Magic Link (Admin)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail
    });

    if (linkError || !linkData.properties?.email_otp) {
      console.error('Failed to generate test user link:', linkError);
      return;
    }

    // 2. Exchange the OTP for a Session (Simulates clicking the link)
    const { data: sessionData } = await supabase.auth.verifyOtp({
      email: testEmail,
      token: linkData.properties.email_otp,
      type: 'magiclink'
    });

    if (sessionData?.session) {
       // Save the session to storage state
       const storageState = {
         origins: [{ origin: baseURL, localStorage: [{ name: 'sb-productshift-auth-token', value: JSON.stringify(sessionData.session) }] }]
       };
       fs.writeFileSync(storageStatePath, JSON.stringify(storageState));
       return;
    }
  }
  
  // Fallback: Create empty state if auth fails (so unauthenticated tests can still run)
  fs.writeFileSync(storageStatePath, JSON.stringify({ cookies: [], origins: [] }));
}

export default globalSetup;