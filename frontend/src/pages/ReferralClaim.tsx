import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Gift, ArrowRight, CheckCircle } from 'lucide-react';

const ReferralClaim: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState(false);

  const refCode = searchParams.get('ref');
  const segment = searchParams.get('segment');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    if (!refCode) {
      navigate('/'); // Redirect home if no code provided
    }
  }, [refCode, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsExisting(false);

    // 0. Check Eligibility (Prevent existing users from claiming)
    try {
      const checkRes = await fetch('/api/user/check-referral-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!checkRes.ok) {
        // Fallback if server is down/erroring to allow flow to continue or fail gracefully
        console.warn("Referral check skipped due to server error");
        // We don't return here; we let the login attempt proceed so the user isn't blocked.
      }

      const checkData = await checkRes.json();
      
      if (checkData.eligible === false) {
        setIsExisting(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Eligibility check failed", err);
      // Proceeding cautiously if check fails, backend claim will still block if needed
    }

    // 1. Save referral code to localStorage so it persists after magic link redirect
    if (refCode) {
      localStorage.setItem('pendingReferral', refCode);
    }

    // 2. Always redirect to the tool so they can use their free test immediately
    const baseUrl = `${window.location.origin}/ai-powered-ux`;
    
    // Build params: Trigger animation & preserve segment context
    const params = new URLSearchParams();
    params.append('new_credit', 'true');
    params.append('referral_claim', 'true');
    if (segment) params.append('segment', segment);
    if (refCode) params.append('ref', refCode); // Critical: Pass ref code through magic link

    const redirectTo = `${baseUrl}?${params.toString()}`;

    // 3. Send Magic Link
    // FIX: Use backend endpoint to ensure branded email and suppress default Supabase email
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send magic link');
      
      setSent(true);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <NeoCard className="text-center">
          {!sent ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-pink-100 p-4 rounded-full">
                  <Gift className="text-pink-600" size={48} />
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">You've been gifted 3 free credits!</h1>
              <p className="text-gray-600 mb-6">
                Please provide your email to receive your 3 free credits. We'll send you a magic link to sign in instantly.
              </p>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {isExisting && (
                  <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-200">
                    We're sorry. You already have an account with us. You can <a href="/login" className="underline text-red-800 hover:text-red-900">add more tests to your account here</a>.
                  </div>
                )}
                {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
                <NeoButton type="submit" className="w-full justify-center" disabled={loading}>
                  {loading ? 'Sending...' : 'Claim Your 3 Free Credits'} <ArrowRight size={16} />
                </NeoButton>
              </form>
            </>
          ) : (
            <div className="py-8 animate-fade-in">
              <div className="flex justify-center mb-4">
                <CheckCircle className="text-green-500" size={64} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-600">
                We sent a magic link to <strong>{email}</strong>.<br/>
                Click it to sign in and start your free test!
              </p>
            </div>
          )}
        </NeoCard>
      </div>
    </div>
  );
};

export default ReferralClaim;