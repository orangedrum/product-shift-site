import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { CreditCard, Package, Clock, ArrowRight, X, AlertTriangle, Handshake, Ticket, Edit, Check, Loader2 } from 'lucide-react';

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [cancelNotification, setCancelNotification] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/login');
      else fetchData(session.user.email);
    });

    // Listen for Auth Changes (Critical for Email Updates)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        setSession(session);
        if (session) fetchData(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const token = searchParams.get('verify_email_token');
    const sig = searchParams.get('sig');

    if (token && sig) {
      setEmailLoading(true);
      fetch('/api/user/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, sig })
      })
      .then(res => res.json())
      .then(async (data) => {
        if (data.success) {
          const { data: { session: newSession } } = await supabase.auth.refreshSession();
          if (newSession) {
            setSession(newSession);
            fetchData(newSession.user.email);
          }
          setEmailMessage({ type: 'success', text: 'Email address updated successfully!' });
        } else {
          setEmailMessage({ type: 'error', text: data.error || 'Failed to verify email change.' });
        }
      })
      .finally(() => {
        setEmailLoading(false);
        setSearchParams({}); // Clean URL
      });
    }
  }, [searchParams, setSearchParams]);

  const fetchData = async (email: string | undefined) => {
    if (!email) return;
    
    // Fetch Customer Details
    const { data: custData, error } = await supabase
      .from('customers')
      .select('credits, plan_status')
      .eq('email', email)
      .single();
    
    if (!error && custData) {
      setCustomer(custData);
    }

    // Subscribe to Realtime Changes
    const channel = supabase
      .channel('my-account-credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `email=eq.${email}`,
        },
        (payload) => {
          setCustomer((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();
      
    // Fetch Transactions via API
    try {
      const res = await fetch(`/api/user/transactions?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading account details...</div>;

  const isSmb = session?.user?.user_metadata?.segment === 'smb';
  const pricingLink = isSmb ? '/simple-website-checkup#pricing' : '/landingpg-aiuxagent#pricing';

  const handleCheckout = async (planId: string, applyDiscount = false) => {
    const referralId = (window as any).promotekit_referral;
    console.log('🛒 Account Checkout - Referral ID:', referralId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: planId, 
          email: session?.user?.email, 
          applyDiscount,
          promotekit_referral: (window as any).promotekit_referral 
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout failed", e);
    }
  };

  const handleCancelAccount = async () => {
    if (!session?.user?.email) return;
    try {
      // Optimistic Update: Update UI immediately before API returns
      setCustomer((prev: any) => ({ ...prev, plan_status: 'cancelled' }));

      await fetch('/api/user/cancel-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      });
      // Close modal, show notification, refresh data
      setShowUnsubscribeModal(false);
      setCancelNotification(true);
      fetchData(session.user.email);
    } catch (e) {
      console.error('Cancel failed', e);
    }
  };

  const handleUndoCancel = async () => {
    if (!session?.user?.email) return;
    try {
      // Optimistic Update: Update UI immediately
      setCustomer((prev: any) => ({ ...prev, plan_status: 'active' }));

      await fetch('/api/user/undo-cancel-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      });
      setCancelNotification(false);
      fetchData(session.user.email);
    } catch (e) {
      console.error('Undo cancel failed', e);
    }
  };

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setRedeemLoading(true);
    setRedeemMessage(null);

    try {
      const res = await fetch('/api/user/redeem-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, code: couponCode })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRedeemMessage({ type: 'success', text: data.message });
        setCouponCode('');
        fetchData(session.user.email); // Refresh credits
      } else {
        setRedeemMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setRedeemMessage({ type: 'error', text: 'Failed to redeem code' });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === session?.user?.email) return;
    setEmailLoading(true);
    setEmailMessage(null);
    
    const res = await fetch('/api/user/update-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail })
    });
    
    if (!res.ok) {
      const data = await res.json();
      setEmailMessage({ type: 'error', text: data.error || 'Failed to update email' });
    } else {
      setEmailMessage({ type: 'success', text: 'Confirmation link sent to your NEW email. Please click it to verify.' });
      setIsEditingEmail(false);
    }
    setEmailLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Cancellation Notification Bar */}
      {cancelNotification && (
        <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg animate-fade-in shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You've successfully unsubscribed. Did you do this by accident?{' '}
                <button onClick={handleUndoCancel} className="font-bold underline hover:text-yellow-800">
                  Undo to resubscribe
                </button>
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setCancelNotification(false)}
                  className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-black">My Account</h1>
        <NeoButton onClick={() => navigate('/ai-powered-ux')} variant="secondary">
          Back to Testing
        </NeoButton>
      </div>

      {/* Profile Information */}
      <div className="mb-8">
        <NeoCard title="Profile Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={isEditingEmail ? newEmail : (session?.user?.email || '')}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={!isEditingEmail}
                  className={`w-full p-2 border-2 rounded-lg transition-colors ${isEditingEmail ? 'border-black bg-white' : 'border-gray-200 bg-gray-100 text-gray-500'}`}
                />
                {isEditingEmail ? (
                  <>
                    <NeoButton onClick={handleUpdateEmail} disabled={emailLoading} className="px-4">
                      {emailLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    </NeoButton>
                    <button onClick={() => { setIsEditingEmail(false); setNewEmail(''); setEmailMessage(null); }} className="p-2 text-gray-500 hover:text-black">
                      <X size={18} />
                    </button>
                  </>
                ) : (
                  <NeoButton variant="secondary" onClick={() => { setIsEditingEmail(true); setNewEmail(session?.user?.email); }} className="px-4">
                    <Edit size={18} />
                  </NeoButton>
                )}
              </div>
              {emailMessage && (
                <p className={`text-xs mt-2 font-bold ${emailMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {emailMessage.text}
                </p>
              )}
            </div>
          </div>
        </NeoCard>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <NeoCard title="Current Plan">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Package className="text-indigo-600" size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Status</p>
              <p className="text-2xl font-black text-black">
                {customer?.plan_status === 'active' ? 'Active Subscription' : 'Pay-as-you-go'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <CreditCard className="text-amber-600" size={32} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase">Available Credits</p>
              <p className="text-2xl font-black text-black">{customer?.credits ?? '--'}</p>
            </div>
          </div>
          <div className="mt-6">
            <NeoButton onClick={() => setShowRefillModal(true)} className="w-full">
              Add More Credits <ArrowRight size={16} />
            </NeoButton>
          </div>
        </NeoCard>

        {/* Coupon Redemption Card */}
        <NeoCard title="Redeem Code">
          <div className="flex flex-col h-full justify-between">
            <p className="text-gray-600 mb-4 text-sm">Have a promo code from an event or partner? Enter it here to unlock free tests.</p>
            <form onSubmit={handleRedeemCoupon} className="space-y-3">
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter Code"
                  className="w-full pl-10 p-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none uppercase"
                />
              </div>
              <NeoButton type="submit" variant="secondary" className="w-full" disabled={redeemLoading || !couponCode}>
                {redeemLoading ? 'Verifying...' : 'Redeem'}
              </NeoButton>
              {redeemMessage && (
                <p className={`text-xs font-bold text-center ${redeemMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{redeemMessage.text}</p>
              )}
            </form>
          </div>
        </NeoCard>
      </div>

      {/* Affiliate Program (Subscribers Only) */}
      {customer?.plan_status === 'active' && (
        <div className="mb-12">
          <NeoCard title="Partner Program">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 bg-gray-900 rounded-full text-white">
                <Handshake size={32} />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-lg font-bold text-black">Partner Program</h3>
                <p className="text-gray-600">Thanks for being a subscriber! Don't forget to share your link to earn 30% recurring commissions.</p>
              </div>
              <a href="https://theproductshift.promotekit.com" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                <NeoButton className="w-full">Go to Affiliate Dashboard</NeoButton>
              </a>
            </div>
          </NeoCard>
        </div>
      )}

      <NeoCard title="Transaction History">
        {transactions.length === 0 ? (
          <p className="text-gray-500 italic">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-black">
                <tr>
                  <th className="pb-3 font-black text-black">Date</th>
                  <th className="pb-3 font-black text-black">Amount</th>
                  <th className="pb-3 font-black text-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 font-mono font-bold text-black">
                      ${(tx.amount_total / 100).toFixed(2)} {tx.currency.toUpperCase()}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeoCard>

      {/* Danger Zone */}
      {customer?.plan_status === 'active' && (
        <div className="mt-12 border-2 border-red-100 bg-red-50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-700 mb-4">Cancelling your account will stop $29.00 monthly payments and you will no longer receive 50 credits a month.</p>
              <button onClick={() => setShowUnsubscribeModal(true)} className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-sm">
                Unsubscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refill Credits Modal */}
      {showRefillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 no-print" style={{ zIndex: 9999 }}>
          <div className="max-w-md w-full relative">
            <NeoCard title="Refill Credits" className="relative">
              <button 
                onClick={() => setShowRefillModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
              >
                <X size={24} />
              </button>
              
              <p className="text-gray-600 mb-6 font-medium">Select a credit pack to continue testing immediately. <span className="text-xs text-black block mt-1">(3 credits = about 1 URL)</span></p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleCheckout('pack-3')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <span className="font-bold text-lg text-black">9 Credits</span>
                  <span className="font-black text-xl text-black">$14</span>
                </button>

                <button 
                  onClick={() => handleCheckout('pack-15')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black bg-[#ff8c00] rounded-xl hover:bg-[#ffa500] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg text-black">45 Credits</span>
                    <span className="text-xs text-black font-medium">Best Value</span>
                  </div>
                  <span className="font-black text-xl text-black">$69</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Have your own AI API Keys and want infinite tests? <br/>
                  <button onClick={() => navigate('/waitlist')} className="text-indigo-600 font-bold hover:underline">Switch to our Agency plan</button>
                </p>
              </div>
            </NeoCard>
          </div>
        </div>
      )}

      {/* Unsubscribe / Switch Modal */}
      {showUnsubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 no-print" style={{ zIndex: 9999 }}>
          <div className="max-w-md w-full relative">
            <NeoCard title="Switch & Save?">
              <button 
                onClick={() => setShowUnsubscribeModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
              >
                <X size={24} />
              </button>
              
              <p className="text-gray-600 mb-6 font-medium">
                Switch to packs? We'll give you a <span className="font-black text-green-600">10% discount</span> on your next pack of tests as a thank you for being with us.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleCheckout('pack-15', true)}
                  className="w-full flex items-center justify-center p-4 border-2 border-black bg-[#39ff14] rounded-xl hover:bg-[#32e612] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <span className="font-bold text-lg text-black">Accept 10% Off Pack</span>
                </button>

                <button 
                  onClick={handleCancelAccount}
                  className="w-full flex items-center justify-center p-4 border-2 border-transparent text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold"
                >
                  Decline & Cancel Account
                </button>
              </div>
            </NeoCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccount;