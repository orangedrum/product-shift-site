import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate('/ai-powered-ux'); // Redirect if already logged in
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate('/ai-powered-ux');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: { emailRedirectTo: `${window.location.origin}/ai-powered-ux` }, // Redirect to tool after login
      });
      if (error) throw error;
      setLoginMessage({ type: 'success', text: 'Check your email for the magic link!' });
    } catch (error: any) {
      setLoginMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full">
        <NeoCard>
          <h2 className="text-2xl font-black mb-4 text-black">Sign In / Sign Up</h2>
          <p className="text-gray-600 mb-6 font-medium">Enter your email to receive a magic link. No password required.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] transition-all font-medium"
                placeholder="you@example.com"
              />
            </div>
            
            {loginMessage && <div className={`p-3 rounded-lg text-sm font-bold border-2 border-black ${loginMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{loginMessage.text}</div>}
            <NeoButton type="submit" variant="primary" className="w-full py-3">Send Magic Link</NeoButton>
          </form>
        </NeoCard>
      </div>
    </div>
  );
};

export default LoginPage;