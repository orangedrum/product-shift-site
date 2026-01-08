import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Users, AlertTriangle, DollarSign, CreditCard, LogOut, RefreshCw, Palette, Check, X } from 'lucide-react';
import { NeoButton } from '../components/NeoButton';
import { NeoCard } from '../components/NeoCard';

type Stats = {
  dailyUsage: number;
  waitlistCount: number;
  recentErrors: { id: number; created_at: string; error_message: string; details: string; }[];
  recentRuns: { id: number; created_at: string; user_identifier: string; url: string; persona_count: number; estimated_cost: number; is_demo: boolean; plan_type: string; revenue: number; }[];
  recentSubscribers: { id: number; created_at: string; email: string; plan_status: string; }[];
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorToDelete, setErrorToDelete] = useState<number | null>(null);

  const fetchStats = async (keyOverride?: string) => {
    const key = keyOverride || secretKey;
    if (!key) return;

    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('adminSecretKey');
        throw new Error('Session expired or invalid key');
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
      setIsAuthenticated(true);
      if (key) localStorage.setItem('adminSecretKey', key);
    } catch (e: any) {
      setError(e.message);
      // Don't de-auth on simple network errors, only on 401s (handled above)
    }
  };

  // 1. Check for stored key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('adminSecretKey');
    if (storedKey) {
      setSecretKey(storedKey);
      fetchStats(storedKey);
    }
  }, []);

  // 2. Auto-refresh polling (every 10 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, secretKey]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSecretKey');
    setSecretKey('');
    setIsAuthenticated(false);
    setStats(null);
  };

  const confirmDeleteError = async () => {
    if (!errorToDelete) return;
    try {
      await fetch(`/api/admin/errors/${errorToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${secretKey}` }
      });
      fetchStats(); // Refresh list
      setErrorToDelete(null);
    } catch (e) {
      console.error('Failed to delete error', e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <NeoCard className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-black mb-2">Admin Access</h1>
            <p className="text-gray-600">Enter the Admin Key to view the Dashboard.</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="secret" className="sr-only">Secret Key</label>
              <input
                type="password"
                id="secret"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full p-3 border-2 border-black rounded-lg focus:outline-none focus:shadow-[2px_2px_0px_0px_#000] transition-all"
                placeholder="Enter admin secret key"
              />
            </div>
            {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
            <NeoButton type="submit" className="w-full">
              Authenticate
            </NeoButton>
          </form>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
            <Link to="/styleguide" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
                <Palette size={16} /> Style Guide
            </Link>
            <button onClick={() => fetchStats()} className="p-2 text-gray-600 hover:text-indigo-600 transition-colors" title="Refresh Data">
                <RefreshCw size={20} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors">
                <LogOut size={16} />
                Logout
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <BarChart className="text-indigo-500" size={32} />
            <div>
              <p className="text-sm text-gray-500">Today's Demo Usage</p>
              <p className="text-3xl font-bold">{stats?.dailyUsage ?? 0} / 25</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <Users className="text-green-500" size={32} />
            <div>
              <p className="text-sm text-gray-500">Waitlist Signups</p>
              <p className="text-3xl font-bold">{stats?.waitlistCount ?? 0}</p>
            </div>
          </div>
        </div>
        {/* Future Paywall Metrics */}
        <div className="bg-white p-6 rounded-lg shadow border border-dashed border-gray-300 opacity-60">
          <div className="flex items-center gap-4">
            <DollarSign className="text-gray-400" size={32} />
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue (MRR)</p>
              <p className="text-3xl font-bold text-gray-400">$0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-dashed border-gray-300 opacity-60">
          <div className="flex items-center gap-4">
            <CreditCard className="text-gray-400" size={32} />
            <div>
              <p className="text-sm text-gray-500">Paying Customers</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.recentSubscribers?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Errors</h2>
        <div className="bg-white p-6 rounded-lg shadow border">
          <ul className="space-y-3">
            {stats?.recentErrors?.map((err) => (
              <li key={err.id} className="text-sm p-3 bg-red-50 rounded-md flex items-start gap-3">
                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <div className="w-full overflow-hidden">
                  <p className="font-mono text-red-700 font-semibold">{err.error_message}</p>
                  <p className="text-xs text-gray-500 mb-2">{new Date(err.created_at).toLocaleString()}</p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">Show Details</summary>
                    <pre className="mt-2 p-2 bg-red-100 text-red-800 rounded overflow-auto text-xs">{err.details}</pre>
                  </details>
                </div>
                <button 
                  onClick={() => setErrorToDelete(err.id)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-white border border-red-200 text-red-600 text-xs font-bold rounded hover:bg-red-50 transition-colors"
                >
                  <Check size={12} /> All Clear
                </button>
              </li>
            ))}
            {stats?.recentErrors?.length === 0 && <p className="text-gray-500">No errors logged. Great!</p>}
          </ul>
        </div>
      </div>

      {/* Recent Subscribers */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Subscribers</h2>
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3">Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSubscribers?.map((sub) => (
                <tr key={sub.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{sub.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sub.plan_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {sub.plan_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(sub.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {stats?.recentSubscribers?.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-gray-500">No subscribers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Runs */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Analysis Runs</h2>
        <div className="bg-white rounded-lg shadow border overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">URL</th>
                        <th scope="col" className="px-6 py-3">Plan</th>
                        <th scope="col" className="px-6 py-3 text-right">Revenue</th>
                        <th scope="col" className="px-6 py-3 text-right">Our Cost</th>
                        <th scope="col" className="px-6 py-3 text-right">Profit</th>
                        <th scope="col" className="px-6 py-3 text-right">Margin</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {stats?.recentRuns?.map((run) => {
                        const profit = run.revenue - run.estimated_cost;
                        const margin = run.revenue > 0 ? (profit / run.revenue) * 100 : 0;
                        const planColor = run.plan_type === 'starter' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

                        return (
                        <tr key={run.id} className="bg-white border-b hover:bg-gray-50 text-sm">
                            <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-xs" title={run.url}>{run.url}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${planColor}`}>
                                    {run.plan_type}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-right text-green-600">${run.revenue.toFixed(2)}</td>
                            <td className="px-6 py-4 font-mono text-right text-red-600">(${run.estimated_cost.toFixed(2)})</td>
                            <td className="px-6 py-4 font-mono text-right font-semibold">${profit.toFixed(2)}</td>
                            <td className="px-6 py-4 font-mono text-right">{margin.toFixed(0)}%</td>
                            <td className="px-6 py-4 text-gray-500">{new Date(run.created_at).toLocaleString()}</td>
                        </tr>
                        )
                    })}
                    {stats?.recentRuns?.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">No recent runs found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {errorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-2">Clear this error?</h3>
            <p className="text-gray-600 mb-6 text-sm">Are you sure this issue is resolved? This will permanently remove it from the log.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setErrorToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteError}
                className="px-4 py-2 bg-green-600 text-white rounded-md font-bold hover:bg-green-700"
              >
                Yes, All Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
