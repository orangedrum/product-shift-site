import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, AlertTriangle, Activity, Users, DollarSign, FileText, Gift, BookOpen, Terminal, ExternalLink, Filter, Send, Tag, Copy, X, HeartHandshake } from 'lucide-react';
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
  const [secretKey, setSecretKey] = useState(() => {
    return initialKey || localStorage.getItem('productShiftAdminKey') || '';
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [refunding, setRefunding] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [hideTestUsers, setHideTestUsers] = useState(true);
  
  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCredits, setInviteCredits] = useState(3);
  const [inviteSegment, setInviteSegment] = useState('tech');
  const [inviteDuration, setInviteDuration] = useState('7 days');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponCredits, setCouponCredits] = useState(5);
  const [couponLoading, setCouponLoading] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponLink, setNewCouponLink] = useState<string | null>(null);

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
        const res = await fetch(`/api/admin/stats?exclude_test_data=${hideTestUsers}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        if (!res.ok) {
          // Handle non-JSON errors (like 500 crashes)
          const text = await res.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || 'Failed to fetch stats');
          } catch {
            throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}`);
          }
        }
        const data = await res.json();
        setStats(data);
        
        // Auto-tag this device as internal for Google Analytics
        localStorage.setItem('ga_internal_user', 'true');

        // Fetch Coupons
        const couponRes = await fetch('/api/admin/coupons', {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          setCoupons(couponData);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [secretKey, hideTestUsers]);

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

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, credits: inviteCredits, segment: inviteSegment, duration: inviteDuration })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Success: ${data.message}`);
        setInviteEmail('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponLoading(true);
    try {
      const res = await fetch('/api/admin/create-coupon', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: couponCode, credits: couponCredits })
      });
      const data = await res.json();
      if (res.ok) {
        setNewCouponLink(`https://app.theproductshift.com/login?coupon=${couponCode.toUpperCase()}`);
        setCouponCode('');
        // Refresh list
        const couponRes = await fetch('/api/admin/coupons', {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        if (couponRes.ok) setCoupons(await couponRes.json());
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to create coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to end this campaign? The code will no longer work.')) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error('Failed to delete coupon', e);
    }
  };

  const handleCompensate = async (email: string) => {
    if (!window.confirm(`Send 2 free credits to ${email} as compensation?`)) return;
    try {
      const res = await fetch('/api/admin/compensate-user', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, credits: 2 })
      });
      if (res.ok) alert('Compensation sent!');
    } catch (e) {
      alert('Failed to compensate');
    }
  };

  // Helper to categorize errors
  const getErrorType = (err: any) => {
    const msg = (err.error_message || '').toUpperCase();
    
    // Known User Errors (Client-side issues)
    if (
      msg.includes('SSL') || 
      msg.includes('NOT_FOUND') || 
      msg.includes('ACCESS_DENIED') ||
      msg.includes('TIMEOUT') ||
      msg.includes('REFUSED')
    ) {
      return { label: 'User Error', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    }
    // Default to System Error
    return { label: 'System Error', badgeClass: 'bg-red-100 text-red-800 border-red-200' };
  };

  // Helper to filter test users
  const isTestUser = (email: string) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower.includes('test') || 
           lower.includes('demo') || 
           lower.includes('example') || 
           lower.includes('localhost') ||
           lower.includes('+smb'); // Catch specific test aliases
  };

  // Helper to extract email from error log
  const extractEmailFromLog = (msg: string) => {
    const match = msg.match(/^\[(.*?)\]/);
    return match && match[1] !== 'Anonymous' ? match[1] : null;
  };

  if (loading) return <div className="p-4">Loading admin dashboard... <Loader2 className="inline-block ml-2 animate-spin" /></div>;
  
  if (error && (error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('missing'))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <NeoCard title="Admin Access">
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              setSecretKey(inputKey);
              localStorage.setItem('productShiftAdminKey', inputKey);
            }}>
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button 
          onClick={() => setHideTestUsers(!hideTestUsers)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold transition-all ${hideTestUsers ? 'bg-indigo-100 border-indigo-600 text-indigo-800' : 'bg-white border-gray-300 text-gray-600'}`}
        >
          <Filter size={16} />
          {hideTestUsers ? 'Test Data Hidden' : 'Show All Data'}
        </button>
      </div>

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

        <NeoCard title="Referrals">
          <div className="flex items-center gap-2 text-pink-600">
            <Gift size={24} />
            <span className="text-2xl font-black">{stats.referralCount || 0}</span>
            <span className="text-sm text-gray-500 font-normal ml-1">successful</span>
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

      {/* --- ACTIONS ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Send size={20} /> Free Trial Manager</h3>
        <NeoCard title="Send Invite">
          <form onSubmit={handleInviteUser} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-bold mb-1">Email</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-lg"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="w-full md:w-1/2">
              <label className="block text-sm font-bold mb-1">Segment</label>
              <select 
                value={inviteSegment}
                onChange={(e) => setInviteSegment(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-lg bg-white"
              >
                <option value="tech">Tech / UX Pro</option>
                <option value="smb">Small Business</option>
              </select>
            </div>
          </form>
          <div className="flex flex-col md:flex-row gap-4 items-end mt-4">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-bold mb-1">Credits</label>
              <input 
                type="number" 
                value={inviteCredits}
                onChange={(e) => setInviteCredits(parseInt(e.target.value))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg bg-white"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-bold mb-1">Expiration</label>
              <select 
                value={inviteDuration}
                onChange={(e) => setInviteDuration(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-lg bg-white"
              >
                <option value="3 days">3 Days</option>
                <option value="7 days">7 Days</option>
                <option value="30 days">30 Days</option>
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <NeoButton type="submit" className="w-full" disabled={inviteLoading}>
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </NeoButton>
            </div>
          </div>
        </NeoCard>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Tag size={20} /> Campaign Manager</h3>
          <NeoCard title="Coupons & Events">
            <form onSubmit={handleCreateCoupon} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-bold mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg uppercase"
                  placeholder="e.g. PODCAST20"
                  required
                />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-bold mb-1">Credits</label>
                <input type="number" value={couponCredits} onChange={(e) => setCouponCredits(parseInt(e.target.value))} className="w-full p-2 border-2 border-gray-300 rounded-lg" />
              </div>
              <div className="w-full md:w-1/4">
                <NeoButton type="submit" className="w-full" disabled={couponLoading}>{couponLoading ? 'Saving...' : 'Create'}</NeoButton>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t-2 border-gray-100">
              <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Active Campaigns</h4>
              {coupons.length === 0 ? (
                <p className="text-gray-500 italic text-sm">No active campaigns.</p>
              ) : (
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b-2 border-black">
                        <th className="pb-2">Code</th>
                        <th className="pb-2">Credits</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {coupons.map(c => (
                        <tr key={c.id}>
                          <td className="py-2 font-bold text-indigo-600">{c.code}</td>
                          <td className="py-2">{c.credits}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 ml-auto">
                              <Trash2 size={14} /> End
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </NeoCard>
        </div>
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
                {stats.recentPayments
                  .filter((p: Payment) => !hideTestUsers || !isTestUser(p.email))
                  .map((payment: Payment) => (
                  <tr key={payment.id}>
                    <td>
                      {payment.email}
                      {isTestUser(payment.email) && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">TEST</span>
                      )}
                    </td>
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
                {stats.recentErrors.map((err: any) => {
                  const { label, badgeClass } = getErrorType(err);
                  const userEmail = extractEmailFromLog(err.error_message);
                  return (
                  <div key={err.id} className={`p-3 border rounded-lg flex justify-between items-start ${label === 'User Error' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${badgeClass}`}>{label}</span>
                        <span className="text-[10px] text-gray-500">{new Date(err.created_at).toLocaleString()}</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{err.error_message}</p>
                      <p className="text-xs text-red-600 break-all whitespace-pre-wrap mt-1 font-mono bg-red-50/50 p-1 rounded">
                        {err.details?.split(' | ').join('\n\n')}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <button onClick={() => handleDeleteError(err.id)} className="text-red-400 hover:text-red-700 p-1" title="Delete Log">
                        <Trash2 size={16} />
                      </button>
                      {userEmail && (
                        <button onClick={() => handleCompensate(userEmail)} className="text-green-600 hover:text-green-800 p-1" title="Compensate User">
                          <HeartHandshake size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
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
                    {stats.recentRuns
                      .filter((r: any) => !hideTestUsers || !r.url.includes('localhost')) // Basic URL filter
                      .map((run: any) => (
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
               {stats.recentSubscribers
                 .filter((s: any) => !hideTestUsers || !isTestUser(s.email))
                 .map((sub: any) => (
                 <li key={sub.id} className="py-2 flex justify-between text-sm">
                   <span>
                     {sub.email}
                     {isTestUser(sub.email) && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">TEST</span>
                      )}
                   </span>
                   <span className="font-bold text-green-600">{sub.plan_status}</span>
                 </li>
               ))}
             </ul>
           ) : <p className="text-gray-500 italic">No subscribers yet.</p>}
        </NeoCard>
      </div>

      {/* --- MISSION CONTROL & DOCS --- */}
      <div className="mt-12 mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BookOpen size={20} /> Mission Control & Docs</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NeoCard title="Payment Monitoring Guide">
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <strong className="block text-gray-900 flex items-center gap-2">
                  1. The Trigger: Stripe <span className="text-xs font-normal text-gray-500">(The "Sent" Signal)</span>
                </strong>
                <p>If Stripe doesn't say "Success," the code never ran.</p>
                <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1">
                  Open Stripe Webhooks <ExternalLink size={12} />
                </a>
              </div>
              <hr />
              <div>
                <strong className="block text-gray-900 flex items-center gap-2">
                  2. The Processor: Vercel <span className="text-xs font-normal text-gray-500">(The "Logic" Signal)</span>
                </strong>
                <p>View real-time logic and console logs to debug errors.</p>
                <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1">
                  Open Vercel Logs <ExternalLink size={12} />
                </a>
              </div>
              <hr />
              <div>
                <strong className="block text-gray-900 flex items-center gap-2">
                  3. The Result: Supabase <span className="text-xs font-normal text-gray-500">(The "Saved" Signal)</span>
                </strong>
                <p>Confirms the user actually got credits/plan updates.</p>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 mt-1">
                  Open Database <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </NeoCard>

          <NeoCard title="Hacker Matrix (Live Logs)">
            <div className="flex flex-col h-full justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  To watch production logs stream in real-time (The "Hacker Matrix"), use the Vercel CLI on your local machine.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 mb-4 overflow-x-auto">
                  <div className="flex items-center gap-2 mb-2 text-gray-500 select-none">
                    <Terminal size={14} /> terminal
                  </div>
                  <p className="mb-2"><span className="text-pink-500"># 1. Install CLI</span><br/>npm i -g vercel</p>
                  <p><span className="text-pink-500"># 2. Stream Logs</span><br/>vercel logs --prod --follow</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                <strong>CTO Note:</strong> We don't stream these directly here for security. The CLI is the most robust way to monitor live traffic during a launch.
              </div>
            </div>
          </NeoCard>
        </div>
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

      {/* Coupon Success Modal */}
      {newCouponLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white p-6 rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative">
            <button onClick={() => setNewCouponLink(null)} className="absolute top-4 right-4 text-gray-500 hover:text-black">
              <X size={24} />
            </button>
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-green-600">
              <Tag /> Campaign Created!
            </h3>
            <p className="text-gray-600 mb-2 font-bold">Share this tracking link:</p>
            <div className="bg-gray-100 p-3 rounded border-2 border-gray-300 break-all font-mono text-sm mb-6 select-all">
              {newCouponLink}
            </div>
            <NeoButton className="w-full" onClick={() => { navigator.clipboard.writeText(newCouponLink); alert('Copied to clipboard!'); }}>
              <Copy size={18} className="mr-2" /> Copy Link
            </NeoButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
