import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { CreditCard, Package, Clock, ArrowRight, X, AlertTriangle } from 'lucide-react';

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) navigate('/login');
      else fetchData(session.user.email);
    });
  }, [navigate]);

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
  const pricingLink = isSmb ? '/landingpg-instantinsights#pricing' : '/landingpg-aiuxagent#pricing';

  const handleCheckout = async (planId: string, applyDiscount = false) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: planId, email: session?.user?.email, applyDiscount }),
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
      await fetch('/api/user/cancel-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email })
      });
      await supabase.auth.signOut();
      navigate('/');
    } catch (e) {
      console.error('Cancel failed', e);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-black">My Account</h1>
        <NeoButton onClick={() => navigate('/ai-powered-ux')} variant="secondary">
          Back to Testing
        </NeoButton>
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
              <p className="text-sm text-gray-500 font-bold uppercase">Available Tests</p>
              <p className="text-2xl font-black text-black">{customer?.credits ?? '--'}</p>
            </div>
          </div>
          <div className="mt-6">
            <NeoButton onClick={() => setShowRefillModal(true)} className="w-full">
              Add More Tests <ArrowRight size={16} />
            </NeoButton>
          </div>
        </NeoCard>
      </div>

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
              <p className="text-sm text-red-700 mb-4">Canceling your account forfeits any existing tests available you may have.</p>
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
            <NeoCard title="Refill Tests" className="relative">
              <button 
                onClick={() => setShowRefillModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black z-10"
              >
                <X size={24} />
              </button>
              
              <p className="text-gray-600 mb-6 font-medium">Select a test pack to continue testing immediately.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => handleCheckout('pack-3')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black rounded-xl hover:bg-gray-50 transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <span className="font-bold text-lg text-black">3 Tests</span>
                  <span className="font-black text-xl text-black">$14</span>
                </button>

                <button 
                  onClick={() => handleCheckout('pack-15')}
                  className="w-full flex items-center justify-between p-4 border-2 border-black bg-[#ff8c00] rounded-xl hover:bg-[#ffa500] transition-all shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="text-left">
                    <span className="block font-bold text-lg text-black">15 Tests</span>
                    <span className="text-xs text-black font-medium">Best Value</span>
                  </div>
                  <span className="font-black text-xl text-black">$69</span>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                  Need consistent testing? <br/>
                  Keeping your existing tests and <button onClick={() => handleCheckout('starter')} className="text-indigo-600 font-bold hover:underline">switch to a Monthly Plan</button>
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