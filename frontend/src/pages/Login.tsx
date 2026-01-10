import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mail, Loader2, Briefcase, PenTool } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [bgGradient, setBgGradient] = useState('');

  // Capture "Tickets" (URL Params)
  const plan = searchParams.get('plan');
  const segment = searchParams.get('segment');
  const refCode = searchParams.get('ref');

  // Set background gradient
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

  // --- THE TRAFFIC COP ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Fetch existing customer data to respect "Source of Truth"
        const { data: customer } = await supabase
          .from('customers')
          .select('segment')
          .eq('email', session.user.email)
          .maybeSingle();
        
        const dbSegment = customer?.segment;

        // 1. BUYER FLOW: If a plan is selected, go straight to Stripe
        if (plan) {
          try {
            const res = await fetch('/api/create-checkout-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // Only use URL segment if DB segment is missing (New User)
              body: JSON.stringify({ planId: plan, email: session.user.email, segment: dbSegment || segment }),
            });
            const data = await res.json();
            if (data.url) {
              window.location.href = data.url; // Redirect to Stripe
              return;
            }
          } catch (e) {
            console.error('Checkout Redirect Failed', e);
            // Fallback to tool if checkout fails
          }
        }

        // Construct destination with all active "tickets" for other flows
        const destParams = new URLSearchParams();

        if (dbSegment) destParams.append('segment', dbSegment);
        else if (segment) destParams.append('segment', segment);
        
        if (refCode) destParams.append('ref', refCode);
        
        const destString = destParams.toString();
        const destination = destString ? `/ai-powered-ux?${destString}` : '/ai-powered-ux';

        // Navigate to the tool with all context preserved
        navigate(destination);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [navigate, plan, segment, refCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // --- REFERRAL ELIGIBILITY CHECK (Pre-Flight) ---
    if (refCode) {
      try {
        const checkRes = await fetch('/api/user/check-referral-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const checkData = await checkRes.json();

        if (!checkData.eligible) {
          setLoading(false);
          setMessage("Existing customers are not eligible for the referral reward. Please sign in without the referral link.");
          return;
        }
      } catch (err) {
        console.error("Referral check failed:", err);
        // We continue if the check fails (fail open) to avoid blocking logins if API is down,
        // but the backend claim process will still enforce rules.
      }
    }

    // --- ACCOUNT EXISTENCE CHECK (The Gatekeeper) ---
    // Only check if NOT buying (plan) and NOT claiming referral (ref)
    if (!plan && !refCode) {
      try {
        const accRes = await fetch('/api/user/check-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const accData = await accRes.json();
        if (!accData.exists) {
          setLoading(false);
          setShowOnboardingModal(true);
          return;
        }
      } catch (e) { console.error('Account check failed', e); }
    }

    // Construct the Redirect URL to preserve our "Tickets"
    // This ensures that when they click the email link, they come back with the same params
    const redirectParams = new URLSearchParams();
    if (plan) redirectParams.append('plan', plan);
    if (segment) redirectParams.append('segment', segment);
    if (refCode) redirectParams.append('ref', refCode);
    
    const redirectTo = `${window.location.origin}/login?${redirectParams.toString()}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    } else {
      setMessage('Check your email for the magic link!');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 transition-colors duration-500"
      style={{
        background: bgGradient || '#f3f4f6'
      }}
    >
      <div className="max-w-md w-full">
        <NeoCard title={plan ? "Complete Your Purchase" : "Sign In"}>
          <p className="text-gray-600 mb-6">
            {plan 
              ? "Sign in or create an account to proceed to checkout." 
              : "Enter your email to sign in."}
          </p>
          
          {!message ? (
            <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
                  required
              />
            </div>
              <NeoButton type="submit" className="w-full justify-center" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <><Mail size={18} className="mr-2" /> Send Magic Link</>}
            </NeoButton>
            </form>
          ) : (
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg text-green-800 font-bold text-center animate-fade-in">
              {message}
            </div>
          )}
        </NeoCard>

        {/* New User Interception Modal */}
        {showOnboardingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
            <div className="max-w-md w-full">
              <NeoCard title="Welcome!">
                <p className="text-gray-600 mb-6 font-medium text-center">
                  It looks like you don't have an account yet. To get started, please tell us about yourself:
                </p>
                <div className="space-y-4">
                  <button 
                    onClick={() => window.location.href = '/landingpg-instantinsights#pricing'}
                    className="w-full flex items-center justify-center gap-3 p-4 border-2 border-black bg-white hover:bg-gray-50 rounded-xl transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                  >
                    <Briefcase className="text-indigo-600" /> <span className="font-bold text-black">I'm a Small Business Owner</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = '/landingpg-aiuxagent#pricing'}
                    className="w-full flex items-center justify-center gap-3 p-4 border-2 border-black bg-white hover:bg-gray-50 rounded-xl transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                  >
                    <PenTool className="text-purple-600" /> <span className="font-bold text-black">I'm a UX Professional</span>
                  </button>
                </div>
              </NeoCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
