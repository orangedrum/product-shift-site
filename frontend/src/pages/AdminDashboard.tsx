import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Trash2, AlertTriangle, Activity, Users, DollarSign, FileText, Gift, BookOpen, Terminal, ExternalLink, Filter, Send, Tag, Copy, X, HeartHandshake, Palette, EyeOff, Eye } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';
import AdminHeader from '../components/AdminHeader';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  secretKey?: string;
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
    try {
      return initialKey || localStorage.getItem('productShiftAdminKey') || '';
    } catch {
      return initialKey || '';
    }
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReasonEnum, setRefundReasonEnum] = useState<string>('requested_by_customer');
  const [refunding, setRefunding] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [hideTestUsers, setHideTestUsers] = useState(true);
  
  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCredits, setInviteCredits] = useState(3);
  const [inviteSegment, setInviteSegment] = useState('tech');
  const [inviteDuration, setInviteDuration] = useState('7 days');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [couponCredits, setCouponCredits] = useState(5);
  const [couponLoading, setCouponLoading] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponLink, setNewCouponLink] = useState<string | null>(null);
  
  // Test User Management
  const [testUsers, setTestUsers] = useState<any[]>([]);
  const [selectedTestUsers, setSelectedTestUsers] = useState<string[]>([]);
  const [blogStats, setBlogStats] = useState<any[]>([]);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s global timeout for ALL requests

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      if (!secretKey) {
        setLoading(false);
        setError('Unauthorized: Key missing');
        clearTimeout(timeoutId);
        return;
      }

      try {
        // 1. Main Stats
        const res = await fetch(`/api/admin/stats?exclude_test_data=${hideTestUsers}&t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${secretKey}` },
          signal: controller.signal
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

        // 2. Fetch Coupons (Protected)
        const couponRes = await fetch('/api/admin/coupons', {
          headers: { Authorization: `Bearer ${secretKey}` },
          signal: controller.signal
        });
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          setCoupons(couponData);
        }

        // 3. Fetch Test Users (Protected)
        if (!hideTestUsers) {
          const usersRes = await fetch('/api/admin/test-users', {
            headers: { Authorization: `Bearer ${secretKey}` },
            signal: controller.signal
          });
          if (usersRes.ok) setTestUsers(await usersRes.json());
        }

        // 4. Fetch Blog Stats (Direct Supabase call)
        const { data: posts } = await supabase
          .from('posts')
          .select('title, views, slug')
          .order('views', { ascending: false })
          .limit(5);
        if (posts) setBlogStats(posts);

      } catch (e: any) {
        if (e.name === 'AbortError') {
          setError('Connection timed out. Is the backend running?');
        } else {
          setError(e.message);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchStats();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [secretKey, hideTestUsers]);

  const handleRefund = async () => {
    if (!selectedPayment) return;
    
    // Safety check for empty ID
    if (!selectedPayment.stripe_session_id) {
      alert("Error: This payment record is missing a Stripe Session ID and cannot be refunded automatically.");
      return;
    }

    setRefunding(true);
    try {
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: selectedPayment.id, reason: refundReasonEnum }),
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
      alert('Refund processed successfully.');
    } catch (e: any) {
      alert(`Refund Error: ${e.message}`);
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

  const handleInviteUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInviteLoading(true);
    setInviteMessage(null);
    console.log('🚀 Sending invite to:', inviteEmail); // Debug log for browser console

    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteMessage({ type: 'error', text: 'Please enter a valid email address.' });
      setInviteLoading(false);
      return;
    }

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
        setInviteMessage({ type: 'success', text: `Invite sent! ${data.message}` });
        setInviteEmail('');
      } else {
        setInviteMessage({ type: 'error', text: `Failed: ${data.error}` });
      }
    } catch (err) {
      setInviteMessage({ type: 'error', text: 'Network error. Failed to send invite.' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponLoading(true);
    try {
      const codeToCreate = couponCode.toUpperCase();
      const res = await fetch('/api/admin/create-coupon', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: codeToCreate, credits: couponCredits })
      });
      const data = await res.json();
      if (res.ok) {
        setCouponCode('');
        // Refresh list
        const couponRes = await fetch('/api/admin/coupons', {
          headers: { Authorization: `Bearer ${secretKey}` },
        });
        if (couponRes.ok) {
          const updatedCoupons = await couponRes.json();
          setCoupons(updatedCoupons);
          const newCoupon = updatedCoupons.find((c: any) => c.code === codeToCreate);
          if (newCoupon) setNewCouponLink(newCoupon.link);
        }
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

  const handleBulkDeleteUsers = async () => {
    if (selectedTestUsers.length === 0) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${selectedTestUsers.length} users and all their data?`)) return;

    try {
      const usersToDelete = testUsers.filter(u => selectedTestUsers.includes(u.id));
      
      const res = await fetch('/api/admin/delete-users', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: usersToDelete })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully deleted ${data.deletedCount} users.`);
        setTestUsers(prev => prev.filter(u => !selectedTestUsers.includes(u.id)));
        setSelectedTestUsers([]);
      }
    } catch (e) {
      alert('Failed to delete users');
    }
  };

  const handleTestEmail = async (template: string) => {
    if (!testEmailTarget) return alert('Please enter a target email address');
    setTestEmailLoading(template);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailTarget, template })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to send email');
      }
      alert(`Sent ${template} email to ${testEmailTarget}!`);
    } catch (e: any) { console.error(e); alert(`Failed: ${e.message}`); }
    setTestEmailLoading(null);
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
    <div className="min-h-screen bg-gray-50">
    <AdminHeader />
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-500" title="Your visits are not counted in Google Analytics">
            <EyeOff size={12} /> SEO Tracking Disabled
          </span>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setHideTestUsers(!hideTestUsers)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold transition-all ${hideTestUsers ? 'bg-indigo-100 border-indigo-600 text-indigo-800' : 'bg-white border-gray-300 text-gray-600'}`}
          >
            <Filter size={16} />
            {hideTestUsers ? 'Show Test Data' : 'Hide Test Data'}
          </button>
        </div>
      </div>

      {/* --- TOP METRICS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <NeoCard title="Revenue (Daily / Total)">
          <div className="flex items-center gap-2 text-green-600">
            <DollarSign size={24} />
            <div className="flex flex-col">
              <span className="text-2xl font-black">${stats.totalRevenue ? stats.totalRevenue.toFixed(2) : '0.00'}</span>
              <span className="text-xs text-green-800 font-bold">+${stats.dailyRevenue ? stats.dailyRevenue.toFixed(2) : '0.00'} today</span>
            </div>
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
            <div className="flex justify-between"><span>Quick Check (9 Credits):</span> <strong>{stats.salesBreakdown?.pack3 || 0}</strong></div>
            <div className="flex justify-between"><span>Pro Pack (45 Credits):</span> <strong>{stats.salesBreakdown?.pack15 || 0}</strong></div>
            <div className="flex justify-between"><span>Agency Plan:</span> <strong>{stats.salesBreakdown?.starter || 0}</strong></div>
          </div>
        </NeoCard>
      </div>

      {/* --- REVENUE CHART --- */}
      <div className="mb-8">
        <NeoCard title="Revenue Trend (Last 30 Days)">
          <div className="h-64 w-full">
            {stats.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                No revenue data available for chart.
              </div>
            )}
          </div>
        </NeoCard>
      </div>

      {/* --- BLOG STATS ROW --- */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} /> Content Performance</h3>
        <NeoCard title="Top Blog Posts">
          {blogStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-gray-100">
                  <tr>
                    <th className="pb-2 text-gray-500">Title</th>
                    <th className="pb-2 text-right text-gray-500">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blogStats.map((post, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-indigo-600">
                          {post.title}
                        </a>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-indigo-600 flex justify-end items-center gap-2">
                        {post.views || 0} <Eye size={14} className="text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No blog posts found or no views yet.</p>
          )}
        </NeoCard>
      </div>

      {/* --- ACTIONS ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Send size={20} /> Free Trial Manager</h3>
        <NeoCard title="Send Invite">
          {/* Replaced form with div to prevent browser validation blocking */}
          <div>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-bold mb-1">Email</label>
                <input 
                  type="text" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg"
                  placeholder="user@example.com"
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
            </div>
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
                <NeoButton type="button" onClick={() => handleInviteUser()} className="w-full" disabled={inviteLoading}>
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </NeoButton>
              </div>
            </div>
          </div>
          {inviteMessage && (
            <div className={`mt-4 p-3 rounded text-sm font-bold ${inviteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {inviteMessage.text}
            </div>
          )}
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
                          <td className="py-2">
                            <button 
                              onClick={() => setNewCouponLink(c.link)}
                              className="font-bold text-indigo-600 hover:underline"
                              title="View Campaign Link"
                            >
                              {c.code}
                            </button>
                          </td>
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

      {/* --- EMAIL MARKETING TESTER --- */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Send size={20} /> Email Sequence Tester</h3>
        <NeoCard title="Manual Trigger">
          <p className="text-sm text-gray-600 mb-4">Send marketing emails to any address to verify content and branding.</p>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-1">Target Email</label>
            <input 
              type="email" 
              value={testEmailTarget}
              onChange={(e) => setTestEmailTarget(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded-lg max-w-md"
              placeholder="you@example.com"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {['welcome', 'day1', 'day3', 'day5', 'day7', 'day10', 'day12', 'lowCredits', 'lowCreditsReminder'].map((day) => (
              <button key={day} onClick={() => handleTestEmail(day)} disabled={!!testEmailLoading} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-bold flex items-center justify-center gap-2">
                {testEmailLoading === day ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
        </NeoCard>
      </div>

      {/* --- TEST USER MANAGEMENT (Only visible when showing test data) --- */}
      {!hideTestUsers && (
        <div className="mb-8 animate-fade-in">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600"><Trash2 size={20} /> Test User Cleanup</h3>
          <NeoCard title={`Found ${testUsers.length} Test Accounts`}>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">Select users to permanently remove them from Auth and all database tables.</p>
              {selectedTestUsers.length > 0 && (
                <NeoButton variant="danger" onClick={handleBulkDeleteUsers} className="text-xs">
                  Delete {selectedTestUsers.length} Selected
                </NeoButton>
              )}
            </div>
            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white border-b-2 border-gray-200">
                  <tr>
                    <th className="pb-2 w-10">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTestUsers(testUsers.map(u => u.id));
                          else setSelectedTestUsers([]);
                        }}
                        checked={selectedTestUsers.length === testUsers.length && testUsers.length > 0}
                      />
                    </th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Created</th>
                    <th className="pb-2">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {testUsers.map(user => (
                    <tr key={user.id} className="hover:bg-red-50">
                      <td className="py-2">
                        <input 
                          type="checkbox" 
                          checked={selectedTestUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTestUsers(prev => [...prev, user.id]);
                            else setSelectedTestUsers(prev => prev.filter(id => id !== user.id));
                          }}
                        />
                      </td>
                      <td className="py-2 font-mono text-xs">{user.email}</td>
                      <td className="py-2 text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="py-2 text-gray-500 text-xs">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NeoCard>
        </div>
      )}

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
                    <td className="font-mono">${(payment.amount_total / 100).toFixed(2)}</td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${payment.status === 'refunded' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {payment.status}
                      </span>
                    </td>
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
            <div className="my-4">
              <label className="block text-sm font-bold mb-1">Reason</label>
              <select 
                value={refundReasonEnum}
                onChange={(e) => setRefundReasonEnum(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-lg bg-white"
              >
                <option value="requested_by_customer">Requested by Customer</option>
                <option value="duplicate">Duplicate</option>
                <option value="fraudulent">Fraudulent</option>
              </select>
            </div>
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
              <Tag /> Campaign Link
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
    </div>
  );
};

export default AdminDashboard;
