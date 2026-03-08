import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

const PaymentConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const segment = searchParams.get('segment');
  const [status, setStatus] = useState<'loading' | 'success' | 'timeout'>('loading');
  const [verifiedViaApi, setVerifiedViaApi] = useState(false);
  const [isFirstPayment, setIsFirstPayment] = useState(false);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // 1. FAST LANE: If API verified it, succeed immediately.
    // This prevents waiting for the DB polling loop if the API is faster.
    if (verifiedViaApi) {
      setStatus('success');
      const timer = setTimeout(() => {
        navigate(`/ai-powered-ux?new_credit=true${segment ? `&segment=${segment}` : ''}${isFirstPayment ? '&first_buy=true' : ''}`);
      }, 1500);
      return () => clearTimeout(timer);
    }

    let pollInterval: NodeJS.Timeout;

    const startChecks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // FIX: Do not return early if session is missing. We can still verify the payment via API.

      // 2. Trigger API Verification (Fire & Forget)
      // This runs in parallel with DB polling.
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.verified) {
          if (data.isFirstPayment) setIsFirstPayment(true);
          setVerifiedViaApi(true); // Triggers re-render -> Fast Lane
        }
      })
      .catch(err => console.error('Verification API failed:', err));

      // 3. Poll DB (The Safety Net)
      let attempts = 0;
      const maxAttempts = 60;

      pollInterval = setInterval(async () => {
        attempts++;
        
        // Check if the payment has been logged in our DB (Webhook completed)
        const { data: payments } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_session_id', sessionId)
          .limit(1);
          
        if (payments && payments.length > 0) {
          clearInterval(pollInterval);
          
          // Check if this is the first payment (Explicit check to avoid stale state closure)
          let isFirst = false;
          if (session?.user?.email) {
            const { count } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('email', session.user.email).eq('status', 'paid');
            isFirst = count === 1;
          }

          setStatus('success');
          // Short delay to show the success state before redirecting
          setTimeout(() => navigate(`/ai-powered-ux?new_credit=true${segment ? `&segment=${segment}` : ''}${isFirst ? '&first_buy=true' : ''}`), 1500);
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setStatus('timeout');
        }
      }, 1000);
    };

    startChecks();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [navigate, sessionId, verifiedViaApi, segment, isFirstPayment]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center border border-gray-100">
        {status === 'loading' && (
          <div className="animate-fade-in">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirming Payment...</h2>
            <p className="text-gray-600">We're syncing your payment to your account. This usually takes just a moment.</p>
            
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
