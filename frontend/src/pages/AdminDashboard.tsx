import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, AlertTriangle, Activity, Users, DollarSign, FileText } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';

interface AdminDashboardProps {
  secretKey: string;
}

interface Payment {
  id: number;
  email: string;
  amount_total: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ secretKey: initialKey }) => {
  const [secretKey, setSecretKey] = useState(initialKey);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refunding, setRefunding] = useState(false);
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      if (!secretKey) {
        setLoading(false);
        setError('Unauthorized: Key missing');
        return;
      }

      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch stats');
        }
        const data = await res.json();
        setStats(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [secretKey]);

  const handleRefund = async () => {
    if (!selectedPayment) return;
    setRefunding(true);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: selectedPayment.id, reason: refundReason }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to issue refund');
      }
      // Refresh Stats & Clear Selection
      const data = await res.json();
      console.log('Refund successful:', data);
      setStats((prevStats: any) => ({
        ...prevStats,
        recentPayments: prevStats.recentPayments.map((p: Payment) =>
          p.id === selectedPayment.id ? { ...p, status: 'refunded' } : p
        ),
      }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefunding(false);
      setSelectedPayment(null); // Clear selection
    }
  };

  const handleDeleteError = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this error log?')) return;
    
    try {
      const res = await fetch(`/api/admin/errors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      
      if (res.ok) {
        setStats((prev: any) => ({
          ...prev,
          recentErrors: prev.recentErrors.filter((e: any) => e.id !== id)
        }));
      }
    } catch (e) {
      console.error('Failed to delete error', e);
    }
  };

  if (loading) return <div className="p-4">Loading admin dashboard... <Loader2 className="inline-block ml-2 animate-spin" /></div>;
  
  if (error && (error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('missing'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <NeoCard title="Admin Access">
            <form onSubmit={(e) => { e.preventDefault(); setSecretKey(inputKey); }}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Enter Secret Key</label>
                <input 
                  type="password" 
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                  placeholder="Enter Admin PIN / Key..."
                />
              </div>
              <NeoButton type="submit" className="w-full">
                Access Dashboard
              </NeoButton>
            </form>
          </NeoCard>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-4 text-red-500 font-bold">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      {/* --- TOP METRICS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <NeoCard title="Total Revenue">
          <div className="flex items-center gap-2 text-green-600">
            <DollarSign size={24} />
            <span className="text-2xl font-black">${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}</span>
          </div>
        </NeoCard>
        
        <NeoCard title="Daily Usage">
          <div className="flex items-center gap-2 text-indigo-600">
            <Activity size={24} />
            <span className="text-2xl font-black">{stats.dailyUsage || 0}</span>
            <span className="text-sm text-gray-500 font-normal ml-1">tests run today</span>
          </div>
        </NeoCard>

        <NeoCard title="Waitlist">
          <div className="flex items-center gap-2 text-purple-600">
            <Users size={24} />
            <span className="text-2xl font-black">{stats.waitlistCount || 0}</span>
            <span className="text-sm text-gray-500 font-normal ml-1">signups</span>
          </div>
        </NeoCard>

        <NeoCard title="Sales Breakdown">
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>3-Packs:</span> <strong>{stats.salesBreakdown?.pack3 || 0}</strong></div>
            <div className="flex justify-between"><span>15-Packs:</span> <strong>{stats.salesBreakdown?.pack15 || 0}</strong></div>
            <div className="flex justify-between"><span>Subscriptions:</span> <strong>{stats.salesBreakdown?.starter || 0}</strong></div>
          </div>
        </NeoCard>
      </div>

      {/* --- FINANCIALS SECTION --- */}
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><DollarSign size={20} /> Financials</h3>
      <NeoCard title="Recent Payments">
        {stats.recentPayments && stats.recentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((payment: Payment) => (
                  <tr key={payment.id}>
                    <td>{payment.email}</td>
                    <td>${(payment.amount_total / 100).toFixed(2)}</td>
                    <td>{payment.status}</td>
                    <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td>
                      {payment.status === 'paid' && (
                        <button onClick={() => setSelectedPayment(payment)} className="text-blue-500 hover:underline">
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No recent payments found.</p>
        )}
      </NeoCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* --- OPERATIONAL HEALTH SECTION --- */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle size={20} /> System Health</h3>
          <NeoCard title="Recent Errors">
            {stats.recentErrors && stats.recentErrors.length > 0 ? (
              <div className="space-y-4">
                {stats.recentErrors.map((err: any) => (
                  <div key={err.id} className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-start">
                    <div className="overflow-hidden">
                      <p className="font-bold text-red-800 text-sm">{err.error_message}</p>
                      <p className="text-xs text-red-600 truncate">{err.details}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{new Date(err.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleDeleteError(err.id)} className="text-red-400 hover:text-red-700 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No recent errors logged.</p>
            )}
          </NeoCard>
        </div>

        {/* --- USAGE LOGS SECTION --- */}
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} /> Usage Logs</h3>
          <NeoCard title="Recent Analysis Runs">
            {stats.recentRuns && stats.recentRuns.length > 0 ? (
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2">URL</th>
                      <th className="pb-2">Plan</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.recentRuns.map((run: any) => (
                      <tr key={run.id}>
                        <td className="py-2 max-w-[150px] truncate" title={run.url}>{run.url}</td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            run.plan_type === 'starter' ? 'bg-purple-100 text-purple-800' :
                            run.plan_type === 'demo' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {run.plan_type}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{new Date(run.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No analysis runs found.</p>
            )}
          </NeoCard>
        </div>
      </div>

      {/* --- SUBSCRIBERS SECTION --- */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users size={20} /> Recent Subscribers</h3>
        <NeoCard title="New Customers">
           {stats.recentSubscribers && stats.recentSubscribers.length > 0 ? (
             <ul className="divide-y">
               {stats.recentSubscribers.map((sub: any) => (
                 <li key={sub.id} className="py-2 flex justify-between text-sm">
                   <span>{sub.email}</span>
                   <span className="font-bold text-green-600">{sub.plan_status}</span>
                 </li>
               ))}
             </ul>
           ) : <p className="text-gray-500 italic">No subscribers yet.</p>}
        </NeoCard>
      </div>

      {/* Refund Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h3 className="text-lg font-bold">Refund Payment</h3>
            <p>Are you sure you want to refund ${selectedPayment.amount_total / 100} to {selectedPayment.email}?</p>
            <input
              type="text"
              placeholder="Reason for refund (optional)"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="border p-2 rounded-md w-full mb-3"
            />
            <div className="flex justify-end gap-2">
              <button className="py-2 px-4 bg-gray-200 rounded-md" onClick={() => setSelectedPayment(null)}>Cancel</button>
              <button className="py-2 px-4 bg-red-500 text-white rounded-md" disabled={refunding} onClick={handleRefund}>
                {refunding ? 'Refunding...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
