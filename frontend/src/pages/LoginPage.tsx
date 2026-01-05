import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/ai-powered-ux');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/ai-powered-ux');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="container mx-auto max-w-md py-12 px-4">
      <div className="p-8 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-bold text-center mb-6">Sign In / Sign Up</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']} // Optional: Add social logins like Google
          redirectTo={`${window.location.origin}/ai-powered-ux`}
        />
      </div>
    </div>
  );
};

export default LoginPage;