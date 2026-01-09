import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'timeout'>('loading');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const checkSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Active Verification (The "Fast Lane")
      // Immediately ask the backend to verify with Stripe, in case webhook is slow/missing.
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.verified) {
          console.log('Payment verified via API, waiting for DB sync...');
        }
      })
      .catch(err => console.error('Verification fallback failed:', err));

      // 2. Passive Polling (The "Safety Net")
      // Poll for subscription activation (Webhook latency is usually 1-3 seconds)
      let attempts = 0;
      const maxAttempts = 30; // ~30 seconds max wait (1s interval)

      const poll = setInterval(async () => {
        attempts++;
        
        // Check if the payment has been logged in our DB (Webhook completed)
        const { data: payment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .single();
          
        if (payment) {
          clearInterval(poll);
          setStatus('success');
          // Short delay to show the success state before redirecting
          setTimeout(() => navigate('/ai-powered-ux'), 1500);
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setStatus('timeout');
        }
      }, 1000);

      return () => clearInterval(poll);
    };

    checkSubscription();
  }, [navigate, sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center border border-gray-100">
        {status === 'loading' && (
          <div className="animate-fade-in">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirming Payment...</h2>
            <p className="text-gray-600">We're syncing your subscription with our secure database. This usually takes just a moment.</p>
            
            <div className="mt-8">
              <button onClick={() => navigate('/account')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1 mx-auto">
                Taking too long? Go to My Account <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
            <p className="text-gray-600">Redirecting you to the tool...</p>
          </div>
        )}
        {status === 'timeout' && (
          <div className="animate-fade-in">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Taking longer than expected</h2>
            <p className="text-gray-600 mb-6">Your payment was successful, but our system is taking a bit longer to sync. You can check your status on your account page.</p>
            <button onClick={() => navigate('/account')} className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
              Go to My Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirmation;
