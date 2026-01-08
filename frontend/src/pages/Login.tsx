import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const segmentParam = searchParams.get('segment'); // e.g. ?segment=smb
  const [session, setSession] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [bgGradient, setBgGradient] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Handle redirects for logged-in users (e.g. purchasing a plan)
  useEffect(() => {
    if (session) {
      const plan = searchParams.get('plan');
      if (plan) {
        // If user is logged in and has a plan param, initiate checkout immediately
        fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: plan, email: session.user.email }),
        })
        .then(res => res.json())
        .then(data => { if (data.url) window.location.href = data.url; })
        .catch(err => console.error('Checkout redirect failed:', err));
      } else {
        navigate('/ai-powered-ux');
      }
    }
  }, [session, searchParams, navigate]);

  // Set background gradient to match the main app
  useEffect(() => {
    const r = () => Math.floor(Math.random() * 100);
    setBgGradient(`
      radial-gradient(1750px circle at 100% 0%, #ff1493 0%, #ff1493 40%, #ff0000 60%, transparent 80%),
      radial-gradient(at ${r()}% ${r()}%, #ff8c00 0%, transparent 50%),
      radial-gradient(at ${r()}% ${r()}%, #ff1493 0%, transparent 50%),
      radial-gradient(at ${r()}% ${r()}%, #ff0000 0%, transparent 50%),
      #ffffff
    `);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage(null);
    setIsSubmitting(true);
    
    const redirectUrl = `${window.location.origin}/ai-powered-ux${segmentParam ? `?segment=${segmentParam}` : ''}`;
    console.log('🔐 Attempting login with redirect URL:', redirectUrl);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: { 
          // Pass the segment through the magic link so we can enforce it on the other side
          emailRedirectTo: redirectUrl,
          data: { segment: segmentParam || 'tech' } // Store the segment in the user's metadata
        }, 
      });
      if (error) throw error;
      setLoginMessage({ type: 'success', text: 'Check your email for the magic link!' });
    } catch (error: any) {
      setLoginMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoginMessage({ 
      type: 'success', 
      text: 'Good news! We use secure Magic Links, so there is no password to forget. Just enter your email above to sign in.' 
    });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500"
      style={{
        background: bgGradient || '#f3f4f6'
      }}
    >
      <div className="max-w-md w-full">
        <NeoCard>
          <h2 className="text-2xl font-black mb-4 text-black">Sign In / Sign Up</h2>
          <p className="text-gray-600 mb-6 font-medium">Enter your email to sign in or create an account. We'll send you a secure magic link and go from there.</p>
          
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
            
            <NeoButton type="submit" variant="primary" className="w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} /> Sending...
                </>
              ) : (
                'Send Magic Link'
              )}
            </NeoButton>
            
            <div className="text-center mt-2">
               <button onClick={handleForgotPassword} className="text-sm text-gray-500 hover:text-black font-medium underline decoration-gray-300 hover:decoration-black transition-all">
                 Forgot Password?
               </button>
            </div>
          </form>
        </NeoCard>
      </div>
    </div>
  );
};

export default LoginPage;