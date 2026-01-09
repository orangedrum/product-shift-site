import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { CreditCard, Package, Clock, ArrowRight } from 'lucide-react';

const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const { data: custData } = await supabase
      .from('customers')
      .select('credits, plan_status')
      .eq('email', email)
      .single();
    setCustomer(custData);

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
              <p className="text-2xl font-black text-black">{customer?.credits || 0}</p>
            </div>
          </div>
          <div className="mt-6">
            <NeoButton onClick={() => navigate(pricingLink)} className="w-full">
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
    </div>
  );
};

export default MyAccount;