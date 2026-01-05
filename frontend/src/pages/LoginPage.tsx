import React, { useEffect, useMemo } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');

  // Create a stable redirect URL that preserves the plan intent
  const redirectUrl = useMemo(() => {
    const url = new URL(`${window.location.origin}/login`);
    if (plan) {
      url.searchParams.set('plan', plan);
    }
    return url.toString();
  }, [plan]);

  useEffect(() => {
    const handleRedirect = async (session: any) => {
      if (!session) return;

      // If the user came here with a plan intent, redirect to Stripe
      if (plan === 'starter') {
        try {
          const { user } = session;
          const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId: 'starter', email: user.email }),
          });
          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        } catch (error) {
          console.error('Checkout redirect error:', error);
          // If error, fall through to dashboard
        }
      }
      navigate('/ai-powered-ux');
    };

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleRedirect(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleRedirect(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, plan]);

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <div className="p-8 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In / Sign Up</h2>
        <p className="text-center text-gray-600 mb-6">Enter your email to receive a secure login link.</p>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']} // Optional: Add social logins like Google
          view="magic_link"
          showLinks={false}
          magicLink={true}
          redirectTo={redirectUrl}
        />
      </div>
    </div>
  );
};

export default LoginPage;